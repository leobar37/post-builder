import { getDatabase } from '../client.js';
import type { AgentSession, SessionMetadata } from '../../agent/core/types.js';

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
    const db = getDatabase();
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
      (session.metadata?.sceneType as string) || 'hook',
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
      scene_type: (session.metadata?.sceneType as string) || 'hook',
      status: 'active',
      messages: JSON.stringify(session.messages),
      metadata: JSON.stringify(session.metadata || {}),
      created_at: now,
      updated_at: now,
    });
  }

  get(id: string): AgentSession | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM agent_sessions WHERE id = ?').get(id) as SessionRow | undefined;
    return row ? this.mapToAgentSession(row) : null;
  }

  getByScene(sceneId: string): AgentSession[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM agent_sessions WHERE scene_id = ? ORDER BY created_at DESC').all(sceneId) as SessionRow[];
    return rows.map(r => this.mapToAgentSession(r));
  }

  getByVideo(videoId: string): AgentSession[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM agent_sessions WHERE video_id = ? ORDER BY created_at DESC').all(videoId) as SessionRow[];
    return rows.map(r => this.mapToAgentSession(r));
  }

  getBySceneId(sceneId: string): AgentSession | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM agent_sessions WHERE scene_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1').get(sceneId, 'active') as SessionRow | undefined;
    return row ? this.mapToAgentSession(row) : null;
  }

  update(id: string, updates: Partial<AgentSession>): AgentSession {
    const db = getDatabase();
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

  /**
   * Atomically get-or-create an active session for a scene.
   * Uses INSERT OR IGNORE to avoid duplicates under concurrent requests.
   */
  upsertActiveSession(
    sceneId: string,
    videoId: string,
    projectId: string,
    sceneType: string,
    metadata: Record<string, unknown>,
  ): AgentSession {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Try to insert; on conflict, do nothing (ignore the duplicate key error)
    db.prepare(`
      INSERT OR IGNORE INTO agent_sessions (id, scene_id, video_id, project_id, scene_type, messages, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, '[]', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      sceneId,
      videoId,
      projectId,
      sceneType,
      JSON.stringify(metadata),
      now,
      now,
    );

    // Retrieve the active session (either newly created or pre-existing)
    return this.getBySceneId(sceneId)!;
  }

  archive(id: string): void {
    const db = getDatabase();
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
