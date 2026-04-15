# T-010: Testing & Validation

## Objective
Tests unitarios, de integración y validación del sistema completo.

## Requirements
- NFR-001: TypeScript strict
- NFR-004: Error Handling
- Cobertura de código > 70%

## Test Structure

```
tests/
├── unit/
│   ├── agent/
│   │   ├── Agent.test.ts
│   │   ├── VideoEditorAgent.test.ts
│   │   └── SessionManager.test.ts
│   └── tools/
│       └── editSceneCode.test.ts
├── integration/
│   ├── api/
│   │   └── agent.routes.test.ts
│   └── agent-flow.test.ts
└── e2e/
    └── chat-flow.spec.ts
```

## Unit Tests

### Agent Core Tests

**File: `tests/unit/agent/Agent.test.ts`**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { Agent } from '../../../src/agent/core/Agent';
import type { AgentConfig, AgentSession } from '../../../src/agent/core/types';

// Mock implementation for testing
class TestAgent extends Agent {
  protected buildSystemPrompt(): string {
    return 'You are a test agent';
  }

  protected getModel(): any {
    return { id: 'test-model' };
  }
}

describe('Agent', () => {
  const config: AgentConfig = {
    model: 'test-model',
    apiKey: 'test-key',
  };

  it('should register tools', () => {
    const agent = new TestAgent(config);
    const mockTool = {
      description: 'Test tool',
      parameters: {},
      execute: vi.fn(),
    };

    agent.registerTool('test', mockTool as any);

    expect(agent['tools'].has('test')).toBe(true);
  });

  it('should require abstract methods implementation', () => {
    expect(() => new Agent(config)).toThrow();
  });
});
```

### VideoEditorAgent Tests

**File: `tests/unit/agent/VideoEditorAgent.test.ts`**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoEditorAgent } from '../../../src/agent/video-editor/VideoEditorAgent';

describe('VideoEditorAgent', () => {
  let agent: VideoEditorAgent;

  beforeEach(() => {
    agent = new VideoEditorAgent({
      model: 'claude-3-5-sonnet-20241022',
      apiKey: 'test-key',
    });
  });

  it('should build system prompt with scene context', () => {
    const session = {
      sessionId: 'test-123',
      messages: [],
      metadata: {
        sceneId: 'scene-1',
        sceneType: 'hook',
      },
    } as any;

    const prompt = agent['buildSystemPrompt'](session);

    expect(prompt).toContain('Scene ID: scene-1');
    expect(prompt).toContain('Scene Type: hook');
    expect(prompt).toContain('Remotion');
  });

  it('should register OpenCode tool', () => {
    expect(agent['tools'].has('editSceneCode')).toBe(true);
  });
});
```

### Tool Tests

**File: `tests/unit/tools/editSceneCode.test.ts`**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { createEditSceneCodeTool } from '../../../src/agent/video-editor/tools/editSceneCode';

describe('editSceneCode tool', () => {
  it('should extract code from markdown blocks', async () => {
    const mockAcpClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      sendPrompt: vi.fn().mockResolvedValue({
        content: '```typescript\nconst x = 1;\n```',
      }),
      shutdown: vi.fn().mockResolvedValue(undefined),
    };

    const tool = createEditSceneCodeTool(mockAcpClient as any);

    const result = await tool.execute({
      description: 'Test',
    });

    expect(result.code).toBe('const x = 1;');
    expect(mockAcpClient.connect).toHaveBeenCalled();
    expect(mockAcpClient.shutdown).toHaveBeenCalled();
  });
});
```

## Integration Tests

### API Routes Tests

**File: `tests/integration/api/agent.routes.test.ts`**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../../../src/server/hono';

describe('Agent API Routes', () => {
  const request = supertest(app.fetch);

  describe('POST /api/agent/sessions', () => {
    it('should create a new session', async () => {
      const response = await request
        .post('/api/agent/sessions')
        .send({
          sceneId: 'scene-1',
          videoId: 'video-1',
          projectId: 'project-1',
          sceneType: 'hook',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request
        .post('/api/agent/sessions')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/agent/sessions/:id', () => {
    it('should return session data', async () => {
      // First create a session
      const createRes = await request
        .post('/api/agent/sessions')
        .send({
          sceneId: 'scene-1',
          videoId: 'video-1',
          projectId: 'project-1',
        });

      const sessionId = createRes.body.sessionId;

      const response = await request.get(`/api/agent/sessions/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.session.id).toBe(sessionId);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request.get('/api/agent/sessions/non-existent');

      expect(response.status).toBe(404);
    });
  });
});
```

### End-to-End Flow Test

**File: `tests/integration/agent-flow.test.ts`**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getVideoEditorAgent } from '../../src/agent/video-editor';
import { SessionManager } from '../../src/agent/core/SessionManager';

describe('Agent Flow', () => {
  let agent: ReturnType<typeof getVideoEditorAgent>;
  let sessionManager: SessionManager;

  beforeAll(() => {
    agent = getVideoEditorAgent();
    sessionManager = new SessionManager();
  });

  it('should complete full chat flow', async () => {
    // 1. Create session
    const session = await sessionManager.createSession({
      sceneId: 'test-scene',
      videoId: 'test-video',
      projectId: 'test-project',
      sceneType: 'hook',
    });

    // 2. Send message
    const stream = await agent.processMessage(session, 'Create a stats grid');

    // 3. Read stream
    const reader = stream.getReader();
    let response = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      response += new TextDecoder().decode(value);
    }

    // 4. Assertions
    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);

    // 5. Verify session was updated
    const updatedSession = await sessionManager.getSession(session.sessionId);
    expect(updatedSession?.messages.length).toBe(1);
  });
});
```

## Test Configuration

**File: `vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
      ],
    },
  },
});
```

**File: `tests/setup.ts`**
```typescript
import { beforeAll, afterAll } from 'vitest';
import { db } from '../api/db/client';

// Setup test database
beforeAll(() => {
  // Use in-memory SQLite or test database
  process.env.DATABASE_URL = ':memory:';
});

// Cleanup after tests
afterAll(() => {
  db.close();
});
```

## Running Tests

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest tests/unit",
    "test:integration": "vitest tests/integration",
    "test:coverage": "vitest --coverage",
    "test:ci": "vitest --run --coverage"
  }
}
```

## Coverage Targets

| Component | Target Coverage |
|-----------|-----------------|
| Agent Core | 80% |
| VideoEditorAgent | 75% |
| Tools | 90% |
| API Routes | 70% |
| Session Management | 80% |

## Manual Testing Checklist

- [ ] Crear sesión desde UI
- [ ] Enviar mensaje y recibir stream
- [ ] Tool invocation visible en UI
- [ ] Código generado se muestra en preview
- [ ] Historial persiste tras refresh
- [ ] Múltiples sesiones por escena funcionan
- [ ] Error handling (desconectar ACP, etc.)

## Verification

- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan
- [ ] Coverage > 70%
- [ ] TypeScript compila sin errores
- [ ] Linting pasa
- [ ] Manual testing completado

## Dependencies
- T-004: OpenCode Tool Integration
- T-008: Frontend Chat UI
- `vitest`, `@vitest/coverage-v8`, `supertest`

## Estimated Effort
6-8 hours
