# Session Manager para OpenCode

## Overview

El **Session Manager** es un componente robusto que gestiona sesiones de OpenCode mediante el protocolo ACP (Agent Client Protocol). Proporciona control completo sobre el ciclo de vida de las sesiones, metadatos, health checks e historial de mensajes.

## Características Principales

- **Metadatos de Sesión**: ID, contextId, PID, estado, timestamps
- **Health Checks**: Verificación de estado de la sesión y proceso
- **Historial de Mensajes**: Tracking de últimos mensajes y respuestas
- **Ciclo de Vida Completo**: Creación, uso, cierre y cleanup automático
- **Eventos**: Emite eventos para integración con SSE

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION MANAGER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SessionMetadata                                        │   │
│  │  • id: string (session UUID)                            │   │
│  │  • contextId: string (project folder)                   │   │
│  │  • pid?: number (process ID)                            │   │
│  │  • status: 'running' | 'completed' | 'error'           │   │
│  │  • lastMessage?: string                                 │   │
│  │  • messageCount: number                                 │   │
│  │  • startedAt: Date                                      │   │
│  │  • lastActivityAt: Date                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AcpClient (por sesión)                                 │   │
│  │  stdin/stdout ↔ OpenCode proceso                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  EventEmitter                                           │   │
│  │  Emite: text, tool_call, tool_result, error, done      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Interfaces

### SessionMetadata

```typescript
export interface SessionMetadata {
  /** UUID único de la sesión */
  id: string;

  /** Identificador del proyecto (carpeta en projects/) */
  contextId: string;

  /** Process ID del proceso OpenCode */
  pid?: number;

  /** Estado actual de la sesión */
  status: 'running' | 'completed' | 'error';

  /** Último mensaje enviado o recibido */
  lastMessage?: string;

  /** Rol del último mensaje ('user' | 'assistant') */
  lastMessageRole?: 'user' | 'assistant';

  /** Contador de mensajes intercambiados */
  messageCount: number;

  /** Timestamp de inicio */
  startedAt: Date;

  /** Timestamp de última actividad */
  lastActivityAt: Date;

  /** Error si status === 'error' */
  errorMessage?: string;

  /** Modelo configurado para esta sesión */
  modelConfig?: ModelConfig;
}
```

### Session Manager Interface

```typescript
export interface ISessionManager {
  /** Crea una nueva sesión ACP */
  createSession(
    sessionId: string,
    contextId: string,
    options?: SessionOptions
  ): Promise<void>;

  /** Envía un prompt a una sesión */
  sendPrompt(
    sessionId: string,
    prompt: string,
    options?: PromptOptions
  ): Promise<void>;

  /** Obtiene metadata de una sesión */
  getSession(sessionId: string): SessionMetadata | undefined;

  /** Lista todas las sesiones activas */
  listSessions(): SessionMetadata[];

  /** Verifica si una sesión está saludable */
  isHealthy(sessionId: string): boolean;

  /** Verifica si una sesión sigue ejecutándose */
  isRunning(sessionId: string): boolean;

  /** Obtiene el último mensaje de una sesión */
  getLastMessage(sessionId: string): string | undefined;

  /** Cierra una sesión */
  closeSession(sessionId: string): Promise<void>;

  /** Cierra todas las sesiones */
  closeAll(): Promise<void>;

  /** Eventos de la sesión */
  on(event: string, listener: (event: SessionEvent) => void): void;
  off(event: string, listener: (event: SessionEvent) => void): void;
}
```

## Implementación

```typescript
// lib/opencode/session-manager.ts

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { AcpClient, Message, ToolCall } from '@agentclientprotocol/sdk';

export interface SessionMetadata {
  id: string;
  contextId: string;
  pid?: number;
  status: 'running' | 'completed' | 'error';
  lastMessage?: string;
  lastMessageRole?: 'user' | 'assistant';
  messageCount: number;
  startedAt: Date;
  lastActivityAt: Date;
  errorMessage?: string;
  modelConfig?: ModelConfig;
}

export interface SessionOptions {
  taskType?: 'idea' | 'code' | 'editing' | 'economy';
  modelConfig?: ModelConfig;
  timeout?: number;
}

export interface PromptOptions {
  taskType?: 'idea' | 'code' | 'editing' | 'economy';
  context?: Record<string, unknown>;
}

export interface SessionEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'reasoning' | 'error' | 'done';
  sessionId: string;
  data: unknown;
  timestamp: Date;
}

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'local';
  model: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

export class SessionManager extends EventEmitter {
  private clients: Map<string, AcpClient> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private sessions: Map<string, SessionMetadata> = new Map();
  private config: SessionManagerConfig;

  constructor(config: SessionManagerConfig = {}) {
    super();
    this.config = {
      defaultTimeout: 180000,
      healthCheckInterval: 30000,
      ...config,
    };

    // Health check periódico
    this.startHealthCheck();
  }

  /**
   * Crea una nueva sesión ACP
   * OpenCode se ejecuta siempre desde el workspace raíz
   */
  async createSession(
    sessionId: string,
    contextId: string,
    options: SessionOptions = {}
  ): Promise<void> {
    // Verificar si ya existe
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    // Crear metadata inicial
    const metadata: SessionMetadata = {
      id: sessionId,
      contextId,
      status: 'running',
      messageCount: 0,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      modelConfig: options.modelConfig,
    };

    this.sessions.set(sessionId, metadata);

    try {
      // Spawn OpenCode en modo ACP (siempre desde workspace/)
      const process = spawn('opencode', ['acp'], {
        cwd: process.cwd(), // Workspace root
        env: {
          ...process.env,
          OPENCODE_API_KEY: process.env.OPENCODE_API_KEY,
        },
      });

      this.processes.set(sessionId, process);
      metadata.pid = process.pid;

      // Crear cliente ACP
      const client = new AcpClient({
        stdin: process.stdin,
        stdout: process.stdout,
      });

      this.clients.set(sessionId, client);

      // Configurar handlers de eventos
      this.setupEventHandlers(sessionId, client, process, metadata);

      // Inicializar sesión
      await client.initialize({
        name: 'video-pipeline-agent',
        version: '1.0.0',
      });

      // Emitir evento de sesión creada
      this.emit('session_created', { sessionId, metadata });

    } catch (error) {
      metadata.status = 'error';
      metadata.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Configura los handlers de eventos para una sesión
   */
  private setupEventHandlers(
    sessionId: string,
    client: AcpClient,
    proc: ChildProcess,
    metadata: SessionMetadata
  ): void {
    // Mensajes del agente
    client.onMessage((message: Message) => {
      this.handleMessage(sessionId, message, metadata);
    });

    // Errores del proceso
    proc.stderr?.on('data', (data: Buffer) => {
      const errorText = data.toString();
      metadata.errorMessage = errorText;

      this.emit('event', {
        type: 'error',
        sessionId,
        data: errorText,
        timestamp: new Date(),
      } as SessionEvent);
    });

    // Cierre del proceso
    proc.on('close', (code) => {
      const wasRunning = metadata.status === 'running';
      metadata.status = code === 0 ? 'completed' : 'error';

      this.emit('event', {
        type: 'done',
        sessionId,
        data: { exitCode: code, wasRunning },
        timestamp: new Date(),
      } as SessionEvent);

      this.cleanup(sessionId);
    });

    // Error del proceso
    proc.on('error', (error) => {
      metadata.status = 'error';
      metadata.errorMessage = error.message;

      this.emit('event', {
        type: 'error',
        sessionId,
        data: error.message,
        timestamp: new Date(),
      } as SessionEvent);
    });
  }

  /**
   * Procesa mensajes entrantes de ACP
   */
  private handleMessage(
    sessionId: string,
    message: Message,
    metadata: SessionMetadata
  ): void {
    // Actualizar metadata
    metadata.lastActivityAt = new Date();
    metadata.messageCount++;

    if (message.content) {
      metadata.lastMessage = message.content;
      metadata.lastMessageRole = message.role as 'user' | 'assistant';
    }

    // Texto del asistente
    if (message.role === 'assistant' && message.content) {
      this.emit('event', {
        type: 'text',
        sessionId,
        data: {
          role: 'assistant',
          content: message.content,
          reasoning: message.reasoning,
        },
        timestamp: new Date(),
      } as SessionEvent);
    }

    // Tool calls
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        this.emit('event', {
          type: 'tool_call',
          sessionId,
          data: toolCall,
          timestamp: new Date(),
        } as SessionEvent);
      }
    }

    // Tool results
    if (message.tool_results) {
      for (const result of message.tool_results) {
        this.emit('event', {
          type: 'tool_result',
          sessionId,
          data: result,
          timestamp: new Date(),
        } as SessionEvent);
      }
    }
  }

  /**
   * Envía un prompt a una sesión
   */
  async sendPrompt(
    sessionId: string,
    prompt: string,
    options: PromptOptions = {}
  ): Promise<void> {
    const client = this.clients.get(sessionId);
    const metadata = this.sessions.get(sessionId);

    if (!client || !metadata) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (metadata.status !== 'running') {
      throw new Error(`Session ${sessionId} is not running (status: ${metadata.status})`);
    }

    // Actualizar metadata del mensaje enviado
    metadata.lastMessage = prompt;
    metadata.lastMessageRole = 'user';
    metadata.messageCount++;
    metadata.lastActivityAt = new Date();

    // Emitir evento de mensaje enviado
    this.emit('event', {
      type: 'text',
      sessionId,
      data: { role: 'user', content: prompt },
      timestamp: new Date(),
    } as SessionEvent);

    // Enviar mensaje al agente
    await client.sendMessage({
      role: 'user',
      content: prompt,
      context: { contextId: metadata.contextId, ...options.context },
    });
  }

  /**
   * Obtiene metadata de una sesión
   */
  getSession(sessionId: string): SessionMetadata | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Lista todas las sesiones
   */
  listSessions(): SessionMetadata[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Lista sesiones activas (running)
   */
  listActiveSessions(): SessionMetadata[] {
    return this.listSessions().filter(s => s.status === 'running');
  }

  /**
   * Verifica si una sesión está saludable
   */
  isHealthy(sessionId: string): boolean {
    const metadata = this.sessions.get(sessionId);
    const proc = this.processes.get(sessionId);

    if (!metadata || !proc) return false;
    if (metadata.status !== 'running') return false;

    // Verificar que el proceso sigue vivo
    // kill -0 no mata el proceso, solo verifica si existe
    try {
      process.kill(metadata.pid!, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica si una sesión está ejecutándose
   */
  isRunning(sessionId: string): boolean {
    const metadata = this.sessions.get(sessionId);
    return metadata?.status === 'running';
  }

  /**
   * Obtiene el último mensaje de una sesión
   */
  getLastMessage(sessionId: string): { content: string; role: string } | undefined {
    const metadata = this.sessions.get(sessionId);
    if (!metadata?.lastMessage) return undefined;

    return {
      content: metadata.lastMessage,
      role: metadata.lastMessageRole || 'assistant',
    };
  }

  /**
   * Obtiene estadísticas de una sesión
   */
  getStats(sessionId: string): SessionStats | undefined {
    const metadata = this.sessions.get(sessionId);
    if (!metadata) return undefined;

    const now = new Date();
    const duration = now.getTime() - metadata.startedAt.getTime();
    const idleTime = now.getTime() - metadata.lastActivityAt.getTime();

    return {
      duration,
      idleTime,
      messageCount: metadata.messageCount,
      messagesPerMinute: metadata.messageCount / (duration / 60000),
    };
  }

  /**
   * Cierra una sesión
   */
  async closeSession(sessionId: string): Promise<void> {
    const client = this.clients.get(sessionId);
    const metadata = this.sessions.get(sessionId);

    if (client) {
      try {
        await client.shutdown();
      } catch (error) {
        // Ignorar errores de shutdown
      }
    }

    if (metadata) {
      metadata.status = 'completed';
    }

    this.cleanup(sessionId);
    this.emit('session_closed', { sessionId });
  }

  /**
   * Cierra todas las sesiones
   */
  async closeAll(): Promise<void> {
    const sessions = Array.from(this.sessions.keys());
    await Promise.all(sessions.map(id => this.closeSession(id)));
  }

  /**
   * Limpia recursos de una sesión
   */
  private cleanup(sessionId: string): void {
    const proc = this.processes.get(sessionId);
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
      // Forzar kill después de un timeout
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
      }, 5000);
    }

    this.processes.delete(sessionId);
    this.clients.delete(sessionId);
    // Nota: mantenemos metadata en sessions para referencia histórica
  }

  /**
   * Health check periódico
   */
  private startHealthCheck(): void {
    setInterval(() => {
      for (const [sessionId, metadata] of this.sessions) {
        if (metadata.status === 'running' && !this.isHealthy(sessionId)) {
          metadata.status = 'error';
          metadata.errorMessage = 'Process health check failed';

          this.emit('event', {
            type: 'error',
            sessionId,
            data: 'Health check failed - process not responding',
            timestamp: new Date(),
          } as SessionEvent);

          this.cleanup(sessionId);
        }
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Destructor - limpia todos los recursos
   */
  destroy(): void {
    this.closeAll();
    this.removeAllListeners();
  }
}

// Tipos adicionales
export interface SessionManagerConfig {
  defaultTimeout?: number;
  healthCheckInterval?: number;
}

export interface SessionStats {
  duration: number;
  idleTime: number;
  messageCount: number;
  messagesPerMinute: number;
}
```

## Uso en API

### Crear Sesión y Enviar Prompt

```typescript
// api/routes/command.ts

import { SessionManager } from '../../lib/opencode/session-manager';

const sessionManager = new SessionManager({
  healthCheckInterval: 30000, // 30 segundos
});

// POST /command
router.post('/', async (req, res) => {
  const { prompt, contextId, sessionId: existingSessionId } = req.body;

  const sessionId = existingSessionId || uuidv4();

  // Crear nueva sesión si no existe
  if (!existingSessionId) {
    await sessionManager.createSession(sessionId, contextId, {
      taskType: 'idea',
    });
  }

  // Verificar que la sesión está saludable
  if (!sessionManager.isHealthy(sessionId)) {
    return res.status(503).json({
      error: 'Session is not healthy',
      sessionId,
    });
  }

  // Enviar prompt
  await sessionManager.sendPrompt(sessionId, prompt, {
    context: { timestamp: new Date().toISOString() },
  });

  res.json({
    sessionId,
    status: 'started',
  });
});

// GET /sessions/:id/status
router.get('/sessions/:id/status', (req, res) => {
  const { id } = req.params;

  const metadata = sessionManager.getSession(id);
  if (!metadata) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const isHealthy = sessionManager.isHealthy(id);
  const stats = sessionManager.getStats(id);
  const lastMessage = sessionManager.getLastMessage(id);

  res.json({
    ...metadata,
    isHealthy,
    stats,
    lastMessage,
  });
});
```

### Integración con SSE

```typescript
// api/routes/events.ts

import { sessionManager } from './command';

// Escuchar eventos del SessionManager y reenviar a SSE
sessionManager.on('event', (event) => {
  const connections = sseConnections.get(event.sessionId) || [];
  const sseData = `data: ${JSON.stringify(event)}\n\n`;

  connections.forEach((res) => {
    res.write(sseData);
  });
});

sessionManager.on('session_created', ({ sessionId, metadata }) => {
  console.log(`Session ${sessionId} created for project ${metadata.contextId}`);
});

sessionManager.on('session_closed', ({ sessionId }) => {
  console.log(`Session ${sessionId} closed`);
});
```

## Estrategias de Uso

### Patrón: Una Sesión por Video

```typescript
async function processVideo(videoId: string, contextId: string) {
  const sessionId = `video-${videoId}`;

  // Crear sesión dedicada para este video
  await sessionManager.createSession(sessionId, contextId, {
    taskType: 'idea',
  });

  try {
    // 1. Generar idea
    await sessionManager.sendPrompt(sessionId, 'Genera idea...');

    // 2. Esperar aprobación del usuario...

    // 3. Generar código para cada escena
    for (const scene of scenes) {
      await sessionManager.sendPrompt(sessionId, `Genera código para: ${scene.description}`);
    }

  } finally {
    // Cerrar sesión al finalizar
    await sessionManager.closeSession(sessionId);
  }
}
```

### Patrón: Sesión Reutilizable

```typescript
async function interactiveEdit(sessionId: string) {
  // Verificar sesión existente
  if (!sessionManager.isRunning(sessionId)) {
    throw new Error('Session not running');
  }

  // Múltiples prompts en la misma sesión
  await sessionManager.sendPrompt(sessionId, 'Cambia el color a azul');
  // ... esperar respuesta ...
  await sessionManager.sendPrompt(sessionId, 'Ahora agranda el texto');
  // ... esperar respuesta ...
  await sessionManager.sendPrompt(sessionId, 'Agrega una animación de fade');
}
```

### Patrón: Health Check Manual

```typescript
async function ensureHealthySession(sessionId: string, contextId: string) {
  // Verificar si existe y está saludable
  const metadata = sessionManager.getSession(sessionId);

  if (!metadata || !sessionManager.isHealthy(sessionId)) {
    // Cerrar sesión dañada si existe
    if (metadata) {
      await sessionManager.closeSession(sessionId);
    }

    // Crear nueva sesión
    await sessionManager.createSession(sessionId, contextId);
    console.log(`Session ${sessionId} recreated`);
  }

  return sessionId;
}
```

## Consideraciones

### Manejo de Errores

```typescript
sessionManager.on('event', (event) => {
  if (event.type === 'error') {
    console.error(`Session ${event.sessionId} error:`, event.data);

    // Decidir si recrear la sesión
    const metadata = sessionManager.getSession(event.sessionId);
    if (metadata) {
      // Notificar al usuario o recrear automáticamente
    }
  }
});
```

### Límites de Recursos

```typescript
// Limitar número máximo de sesiones concurrentes
const MAX_SESSIONS = 10;

async function createSessionWithLimit(sessionId: string, contextId: string) {
  const activeSessions = sessionManager.listActiveSessions();

  if (activeSessions.length >= MAX_SESSIONS) {
    // Cerrar la sesión más antigua
    const oldest = activeSessions.sort(
      (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
    )[0];

    await sessionManager.closeSession(oldest.id);
  }

  await sessionManager.createSession(sessionId, contextId);
}
```

### Timeout de Inactividad

```typescript
// Cerrar sesiones inactivas
setInterval(() => {
  const sessions = sessionManager.listActiveSessions();

  for (const session of sessions) {
    const stats = sessionManager.getStats(session.id);
    if (stats && stats.idleTime > 300000) { // 5 minutos
      console.log(`Closing inactive session: ${session.id}`);
      sessionManager.closeSession(session.id);
    }
  }
}, 60000); // Verificar cada minuto
```

## UI Integration

### Web URL Generation

El Session Manager puede generar URLs para abrir sesiones en OpenCode Web:

```typescript
/**
 * Genera URL para abrir sesión en navegador
 */
getWebUrl(sessionId: string): string | undefined {
  const metadata = this.sessions.get(sessionId);
  if (!metadata) return undefined;

  const baseUrl = process.env.OPENCODE_WEB_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    session_hint: sessionId,
    context: metadata.contextId,
    source: 'video-pipeline',
  });

  return `${baseUrl}/?${params.toString()}`;
}

// Uso en API
router.get('/sessions/:id/web-url', (req, res) => {
  const { id } = req.params;
  const webUrl = sessionManager.getWebUrl(id);

  if (!webUrl) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({ sessionId: id, webUrl });
});
```

### Status Endpoint para UI

```typescript
// GET /sessions/:id/status - Usado por el header status indicator
router.get('/sessions/:id/status', (req, res) => {
  const { id } = req.params;

  const metadata = sessionManager.getSession(id);
  if (!metadata) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    id: metadata.id,
    contextId: metadata.contextId,
    status: metadata.status,
    isHealthy: sessionManager.isHealthy(id),
    messageCount: metadata.messageCount,
    startedAt: metadata.startedAt,
    lastActivityAt: metadata.lastActivityAt,
    lastMessage: sessionManager.getLastMessage(id),
    model: metadata.modelConfig,
    webUrl: sessionManager.getWebUrl(id),
  });
});
```

### Background Execution Support

El Session Manager mantiene procesos en background:

```typescript
// El proceso sigue vivo incluso si el usuario cierra el navegador
async createSession(sessionId: string, contextId: string): Promise<void> {
  // Spawn OpenCode en modo ACP
  const proc = spawn('opencode', ['acp'], {
    cwd: process.cwd(),
    detached: false,  // Mantiene proceso vinculado al servidor
  });

  // Health checks periódicos mantienen el proceso monitoreado
  this.startHealthCheck();
}

// Reconexión a sesión existente
async reconnect(sessionId: string): Promise<SessionMetadata | null> {
  const metadata = this.getSession(sessionId);

  if (metadata && this.isHealthy(sessionId)) {
    return metadata;
  }

  return null;
}
```

## Ver También

- [OpenCode Integration](./opencode.md) - Integración básica con ACP
- [OpenCode Advanced Control](./opencode-advanced.md) - Control avanzado con modelos
- [Unified Agent UI](../architecture/unified-agent-ui.md) - Estrategia de UI unificada
- [Projects](../architecture/projects.md) - Organización de proyectos y contextId
