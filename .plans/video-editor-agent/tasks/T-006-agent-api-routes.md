# T-006: Agent API Routes (Hono)

## Objective
Implementar endpoints HTTP para el agente usando Hono con streaming SSE.

## Requirements
- FR-002: Session Management endpoints
- FR-001: Agent processing endpoint with streaming
- FR-005: Hono API

## Implementation

### 1. Routes Structure

**File: `src/server/routes/agent.ts`**
```typescript
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getVideoEditorAgent } from '../../agent/video-editor';
import { SessionManager } from '../../agent/core/SessionManager';

const app = new Hono();
const agent = getVideoEditorAgent();
const sessionManager = new SessionManager();

// Validation schemas
const createSessionSchema = z.object({
  sceneId: z.string(),
  videoId: z.string(),
  projectId: z.string(),
  sceneType: z.enum(['hook', 'stats', 'cta', 'transition']).optional(),
});

const chatSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
});

// POST /api/agent/sessions - Create new session
app.post('/sessions', zValidator('json', createSessionSchema), async (c) => {
  const data = c.req.valid('json');

  const session = await sessionManager.createSession({
    sceneId: data.sceneId,
    videoId: data.videoId,
    projectId: data.projectId,
    sceneType: data.sceneType || 'hook',
  });

  return c.json({
    success: true,
    sessionId: session.sessionId,
    status: 'created',
  }, 201);
});

// GET /api/agent/sessions/:id - Get session
app.get('/sessions/:id', async (c) => {
  const sessionId = c.req.param('id');
  const session = await sessionManager.getSession(sessionId);

  if (!session) {
    return c.json({ success: false, error: 'Session not found' }, 404);
  }

  return c.json({
    success: true,
    session: {
      id: session.sessionId,
      messages: session.messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
  });
});

// GET /api/agent/sessions?sceneId=:id - Get sessions by scene
app.get('/sessions', async (c) => {
  const sceneId = c.req.query('sceneId');

  if (!sceneId) {
    return c.json({ success: false, error: 'sceneId query param required' }, 400);
  }

  const sessions = await sessionManager.getSessionsByScene(sceneId);

  return c.json({
    success: true,
    sessions: sessions.map(s => ({
      id: s.sessionId,
      messageCount: s.messages.length,
      createdAt: s.createdAt,
    })),
  });
});

// POST /api/agent/chat - Main chat endpoint with streaming
app.post('/chat', zValidator('json', chatSchema), async (c) => {
  const { sessionId, message } = c.req.valid('json');

  // Get session
  const session = await sessionManager.getSession(sessionId);
  if (!session) {
    return c.json({ success: false, error: 'Session not found' }, 404);
  }

  // Save user message
  await sessionManager.addMessage(sessionId, { role: 'user', content: message });

  // Return streaming response
  return stream(c, async (stream) => {
    const responseStream = await agent.processMessage(session, message);
    const reader = responseStream.getReader();

    let assistantMessage = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // value is a Uint8Array
        const chunk = new TextDecoder().decode(value);
        assistantMessage += chunk;

        // Write to SSE stream
        await stream.write(chunk);
      }
    } finally {
      reader.releaseLock();

      // Save assistant message
      await sessionManager.addMessage(sessionId, {
        role: 'assistant',
        content: assistantMessage,
      });
    }
  });
});

// DELETE /api/agent/sessions/:id - Archive session
app.delete('/sessions/:id', async (c) => {
  const sessionId = c.req.param('id');
  await sessionManager.archive(sessionId);
  return c.json({ success: true });
});

export default app;
```

### 2. Register Routes

**Update: `src/server/hono.ts`**

```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import agentRoutes from './routes/agent';

export const app = new Hono();

// Middlewares globales
app.use(logger());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Agent routes
app.route('/api/agent', agentRoutes);

// TODO: Migrate existing routes from Express
// app.route('/api/videos', videoRoutes);
// app.route('/api/scenes', sceneRoutes);
```

### 3. Type-safe client (opcional)

**File: `src/lib/agentClient.ts`**
```typescript
// RPC-style client for the agent API
export const agentClient = {
  async createSession(data: { sceneId: string; videoId: string; projectId: string; sceneType?: string }) {
    const res = await fetch('/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async chat(sessionId: string, message: string): Promise<ReadableStream> {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
    });
    return res.body!;
  },

  async getSession(sessionId: string) {
    const res = await fetch(`/api/agent/sessions/${sessionId}`);
    return res.json();
  },
};
```

## Verification

- [ ] `POST /api/agent/sessions` crea sesión
- [ ] `GET /api/agent/sessions/:id` retorna sesión existente
- [ ] `POST /api/agent/chat` hace streaming SSE
- [ ] Mensajes se persisten después del stream
- [ ] Error 404 para sesiones inexistentes
- [ ] Error 400 para payloads inválidos (zod validation)

## Dependencies
- T-001: Bootstrap Hono API
- T-003: VideoEditorAgent Implementation
- T-005: Session Management System
- `hono/zod-validator` package

## Estimated Effort
4-5 hours
