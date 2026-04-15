# T-005: Session Management System

## Objective
Implementar persistencia de sesiones en SQLite con historial completo de mensajes.

## Requirements
- FR-002: Session Management (Scene = Session)
- NFR-003: Session Persistence

## Implementation

### 1. Database Schema

**Update: `api/db/schema.sql`**
```sql
-- Sessions table for agent conversations
CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  scene_type TEXT CHECK(scene_type IN ('hook', 'stats', 'cta', 'transition')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived')),
  messages TEXT NOT NULL DEFAULT '[]', -- JSON array of CoreMessage
  metadata TEXT DEFAULT '{}', -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scene_id) REFERENCES scenes(id),
  FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sessions_scene ON agent_sessions(scene_id);
CREATE INDEX IF NOT EXISTS idx_sessions_video ON agent_sessions(video_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON agent_sessions(status);

-- Tool invocations log (for debugging/auditing)
CREATE TABLE IF NOT EXISTS session_tool_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_input TEXT NOT NULL, -- JSON
  tool_output TEXT, -- JSON
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  error TEXT,
  FOREIGN KEY (session_id) REFERENCES agent_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_tool_calls_session ON session_tool_calls(session_id);
```

### 2. Repository

**File: `api/db/repositories/session.repository.ts`**
```typescript
import { db } from '../client';
import type { AgentSession, SessionMetadata } from '../../../src/agent/core/types';

export interface SessionRow {
  id: string;
  scene_id: string;
  video_id: string;
  project_id: string;
  scene_type: string;
  status: 'active' | 'completed' | 'archived';
  messages: string; // JSON
  metadata: string; // JSON
  created_at: string;
  updated_at: string;
}

export class SessionRepository {
  create(session: Omit<AgentSession, 'sessionId'> & { sceneId: string; videoId: string; projectId: string }): AgentSession {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO agent_sessions (id, scene_id, video_id, project_id, scene_type, messages, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      session.sceneId,
      session.videoId,
      session.projectId,
      session.metadata?.sceneType || 'hook',
      JSON.stringify(session.messages),
      JSON.stringify(session.metadata || {}),
      now,
      now
    );

    return this.mapToAgentSession({
      id,
      scene_id: session.sceneId,
      video_id: session.videoId,
      project_id: session.projectId,
      scene_type: session.metadata?.sceneType || 'hook',
      status: 'active',
      messages: JSON.stringify(session.messages),
      metadata: JSON.stringify(session.metadata || {}),
      created_at: now,
      updated_at: now,
    });
  }

  get(id: string): AgentSession | null {
    const row = db.prepare('SELECT * FROM agent_sessions WHERE id = ?').get(id) as SessionRow | undefined;
    return row ? this.mapToAgentSession(row) : null;
  }

  getByScene(sceneId: string): AgentSession[] {
    const rows = db.prepare('SELECT * FROM agent_sessions WHERE scene_id = ? ORDER BY created_at DESC').all(sceneId) as SessionRow[];
    return rows.map(r => this.mapToAgentSession(r));
  }

  update(id: string, updates: Partial<AgentSession>): AgentSession {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (updates.messages) {
      sets.push('messages = ?');
      values.push(JSON.stringify(updates.messages));
    }

    if (updates.metadata) {
      sets.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    sets.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    db.prepare(`UPDATE agent_sessions SET ${sets.join(', ')} WHERE id = ?`).run(...values);

    return this.get(id)!;
  }

  archive(id: string): void {
    db.prepare("UPDATE agent_sessions SET status = 'archived' WHERE id = ?").run(id);
  }

  private mapToAgentSession(row: SessionRow): AgentSession {
    return {
      sessionId: row.id,
      messages: JSON.parse(row.messages),
      metadata: JSON.parse(row.metadata),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const sessionRepository = new SessionRepository();
```

### 3. Integration con SessionManager

**Update: `src/agent/core/SessionManager.ts`**

```typescript
import { sessionRepository } from '../../../api/db/repositories/session.repository';

export class SessionManager {
  private repository = sessionRepository;

  async createSession(metadata: SessionMetadata & { sceneId: string; videoId: string; projectId: string }): Promise<AgentSession> {
    return this.repository.create({
      messages: [],
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      sceneId: metadata.sceneId,
      videoId: metadata.videoId,
      projectId: metadata.projectId,
    });
  }

  async getSession(sessionId: string): Promise<AgentSession | null> {
    return this.repository.get(sessionId);
  }

  async getSessionsByScene(sceneId: string): Promise<AgentSession[]> {
    return this.repository.getByScene(sceneId);
  }

  // ... resto de métodos
}
```

## Verification

- [ ] Tabla `agent_sessions` creada correctamente
- [ ] CRUD operations funcionan sin errores
- [ ] Mensajes se serializan/deserializan correctamente (JSON)
- [ ] Índices permiten queries rápidos
- [ ] Relaciones foreign key funcionan

## Dependencies
- T-002: Agent Core Infrastructure (para tipos)
- DB SQLite existente configurada

## Estimated Effort
3-4 hours
