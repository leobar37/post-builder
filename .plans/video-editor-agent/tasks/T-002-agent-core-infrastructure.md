# T-002: Agent Core Infrastructure

## Objective
Crear la infraestructura base del sistema de agentes con clases abstractas y tipos fundamentales.

## Requirements
- FR-001: VideoEditorAgent Core
- FR-007: Extensibilidad (Skills Strategy)
- NFR-001: TypeScript strict

## Implementation

### 1. Tipos fundamentales

**File: `src/agent/core/types.ts`**
```typescript
import type { CoreMessage, Tool, UserContent } from 'ai';

export interface AgentConfig {
  model: string;
  apiKey: string;
  temperature?: number;
  maxSteps?: number;
}

export interface AgentSession {
  sessionId: string;
  messages: CoreMessage[];
  metadata: SessionMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionMetadata {
  [key: string]: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: unknown) => Promise<unknown>;
}

export interface AgentContext {
  session: AgentSession;
  tools: Map<string, Tool>;
}

// Tipos para contenido multimodal
export type { UserContent };

export interface ImagePart {
  type: 'image';
  image: string | Uint8Array;
  mimeType?: string;
}

export interface TextPart {
  type: 'text';
  text: string;
}
```

### 2. Clase base Agent

**File: `src/agent/core/Agent.ts`**
```typescript
import { streamText, type CoreMessage, type Tool, type UserContent } from 'ai';
import type { AgentConfig, AgentSession } from './types';

export abstract class Agent {
  protected config: AgentConfig;
  protected tools: Map<string, Tool> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Register a tool for this agent
   */
  registerTool(name: string, tool: Tool): void {
    this.tools.set(name, tool);
  }

  /**
   * Build system prompt for the agent
   * Override in subclasses
   */
  protected abstract buildSystemPrompt(session: AgentSession): string;

  /**
   * Process a user message and return a stream
   * Supports multimodal content: string, text parts, image parts
   */
  async processMessage(
    session: AgentSession,
    content: UserContent
  ): Promise<ReadableStream> {
    // Construir mensaje de usuario con soporte multimodal
    const userMessage: CoreMessage = {
      role: 'user',
      content,
    };

    const messages: CoreMessage[] = [
      { role: 'system', content: this.buildSystemPrompt(session) },
      ...session.messages,
      userMessage,
    ];

    const result = await streamText({
      model: this.getModel(),
      messages,
      tools: Object.fromEntries(this.tools),
      maxSteps: this.config.maxSteps || 5,
      temperature: this.config.temperature || 0.7,
    });

    return result.toDataStream();
  }

  /**
   * Get AI model instance
   */
  protected abstract getModel(): any;

  /**
   * Get registered tools as record
   */
  protected getToolsRecord(): Record<string, Tool> {
    return Object.fromEntries(this.tools);
  }
}
```

### 3. Session Manager

**File: `src/agent/core/SessionManager.ts`**
```typescript
import type { AgentSession, SessionMetadata } from './types';

export interface SessionRepository {
  create(session: Omit<AgentSession, 'sessionId'>): Promise<AgentSession>;
  get(sessionId: string): Promise<AgentSession | null>;
  update(sessionId: string, updates: Partial<AgentSession>): Promise<AgentSession>;
  delete(sessionId: string): Promise<void>;
}

export class SessionManager {
  constructor(private repository: SessionRepository) {}

  async createSession(metadata: SessionMetadata): Promise<AgentSession> {
    const sessionId = crypto.randomUUID();
    const session: AgentSession = {
      sessionId,
      messages: [],
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.repository.create(session);
  }

  async getSession(sessionId: string): Promise<AgentSession | null> {
    return this.repository.get(sessionId);
  }

  async addMessage(
    sessionId: string,
    message: { role: 'user' | 'assistant'; content: string }
  ): Promise<AgentSession> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.messages.push(message);
    session.updatedAt = new Date();

    return this.repository.update(sessionId, session);
  }
}
```

### 4. Barrel export

**File: `src/agent/core/index.ts`**
```typescript
export { Agent } from './Agent';
export { SessionManager } from './SessionManager';
export * from './types';
```

## Verification

- [ ] Clases compilan sin errores de TypeScript
- [ ] Agent es abstracta y requiere implementación
- [ ] SessionManager tiene métodos CRUD completos
- [ ] Tipos exportados correctamente
- [ ] `processMessage` acepta `UserContent` (string o array de partes)

## Dependencies
- T-001: Bootstrap Hono API (para estructura de carpetas)
- AI SDK v4+ (para tipos `UserContent`, `CoreMessage`)

## Estimated Effort
4-5 hours
