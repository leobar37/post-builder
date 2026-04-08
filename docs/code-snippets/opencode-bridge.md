# OpenCode Bridge - Code Snippets

## Core Library: OpenCodeBridge

### lib/opencode-bridge.ts

```typescript
import { AcpClient, Message, ToolCall } from '@agentclientprotocol/sdk';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'local';
  model: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  system_prompt?: string;
  tools?: string[];
}

export interface OpenCodeModelsConfig {
  default: ModelConfig;
  idea_generation: ModelConfig;
  code_generation: ModelConfig;
  editing: ModelConfig;
  economy?: ModelConfig;
  custom?: Record<string, ModelConfig>;
}

export interface OpenCodeConfig {
  mode: 'acp' | 'cli' | 'skill';
  timeout: number;
  retries: number;
  models: OpenCodeModelsConfig;
  acp: {
    reconnect: boolean;
    maxReconnects: number;
    reconnectDelay: number;
  };
}

export interface OpenCodeEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'reasoning' | 'error' | 'done' | 'model_selected';
  sessionId: string;
  data: any;
  timestamp: Date;
}

export interface SessionMetadata {
  id: string;
  contextId: string;
  startedAt: Date;
  status: 'running' | 'completed' | 'error';
  lastMessage?: string;
  pid?: number;
}

export class OpenCodeBridge extends EventEmitter {
  private clients: Map<string, AcpClient> = new Map();
  private processes: Map<string, any> = new Map();
  private config?: OpenCodeConfig;
  private sessions: Map<string, SessionMetadata> = new Map();

  constructor(config?: OpenCodeConfig) {
    super();
    this.config = config;
  }

  /**
   * Inicia una sesión ACP con OpenCode
   * OpenCode siempre se ejecuta desde el workspace, accede a contexto via projects/{contextId}/
   */
  async createSession(sessionId: string, contextId: string): Promise<void> {
    // Guardar metadata de la sesión
    this.sessions.set(sessionId, {
      id: sessionId,
      contextId,
      startedAt: new Date(),
      status: 'running',
    });

    // Spawn opencode en modo ACP (siempre desde workspace/)
    const process = spawn('opencode', ['acp'], {
      cwd: process.cwd(), // Workspace root, no cambia por proyecto
      env: {
        ...process.env,
        OPENCODE_API_KEY: process.env.OPENCODE_API_KEY,
      },
    });

    this.processes.set(sessionId, process);

    // Actualizar metadata con PID
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pid = process.pid;
    }

    // Crear cliente ACP conectado al stdin/stdout del proceso
    const client = new AcpClient({
      stdin: process.stdin,
      stdout: process.stdout,
    });

    this.clients.set(sessionId, client);

    // Escuchar todos los mensajes del agente
    client.onMessage((message: Message) => {
      this.handleMessage(sessionId, message);
    });

    // Manejar errores del proceso
    process.stderr.on('data', (data) => {
      this.emit('event', {
        type: 'error',
        sessionId,
        data: data.toString(),
        timestamp: new Date(),
      } as OpenCodeEvent);
    });

    process.on('close', (code) => {
      // Actualizar metadata de sesión
      const session = this.sessions.get(sessionId);
      if (session) {
        session.status = code === 0 ? 'completed' : 'error';
      }

      this.emit('event', {
        type: 'done',
        sessionId,
        data: { exitCode: code },
        timestamp: new Date(),
      } as OpenCodeEvent);
      this.cleanup(sessionId);
    });

    // Initialize session
    await client.initialize({
      name: 'video-pipeline-agent',
      version: '1.0.0',
    });
  }

  /**
   * Envía un prompt a la sesión ACP con selección de modelo
   */
  async sendPrompt(
    sessionId: string,
    prompt: string,
    options: {
      taskType?: 'idea' | 'code' | 'editing' | 'economy';
      context?: any;
    } = {}
  ): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Seleccionar modelo según tipo de tarea
    const modelConfig = this.selectModel(options.taskType);

    // Emitir metadata del modelo usado
    this.emit('event', {
      type: 'model_selected',
      sessionId,
      data: {
        provider: modelConfig.provider,
        model: modelConfig.model,
        taskType: options.taskType || 'default',
      },
      timestamp: new Date(),
    } as OpenCodeEvent);

    // Emitir evento de inicio
    this.emit('event', {
      type: 'text',
      sessionId,
      data: { role: 'user', content: prompt },
      timestamp: new Date(),
    } as OpenCodeEvent);

    // Obtener metadata de sesión para el contextId
    const session = this.sessions.get(sessionId);
    const contextId = session?.contextId;

    // Enviar mensaje al agente con parámetros del modelo
    await client.sendMessage({
      role: 'user',
      content: prompt,
      context: contextId ? { contextId } : undefined,
      model_params: {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens,
        system_prompt: modelConfig.system_prompt,
      },
    });
  }

  /**
   * Selecciona el modelo apropiado según el tipo de tarea
   */
  private selectModel(taskType?: string): ModelConfig {
    const models = this.config?.models;
    if (!models) {
      return this.getDefaultModelConfig();
    }

    switch (taskType) {
      case 'idea':
        return models.idea_generation || models.default;
      case 'code':
        return models.code_generation || models.default;
      case 'editing':
        return models.editing || models.code_generation || models.default;
      case 'economy':
        return models.economy || models.default;
      default:
        return models.default;
    }
  }

  /**
   * Configuración por defecto cuando no hay config
   */
  private getDefaultModelConfig(): ModelConfig {
    return {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      temperature: 0.7,
      max_tokens: 4000,
    };
  }

  /**
   * Procesa mensajes entrantes de ACP
   */
  private handleMessage(sessionId: string, message: Message): void {
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
      } as OpenCodeEvent);
    }

    // Tool calls
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        this.emit('event', {
          type: 'tool_call',
          sessionId,
          data: toolCall,
          timestamp: new Date(),
        } as OpenCodeEvent);
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
        } as OpenCodeEvent);
      }
    }
  }

  /**
   * Cierra una sesión
   */
  async closeSession(sessionId: string): Promise<void> {
    const client = this.clients.get(sessionId);
    if (client) {
      await client.shutdown();
    }
    this.cleanup(sessionId);
  }

  private cleanup(sessionId: string): void {
    const process = this.processes.get(sessionId);
    if (process && !process.killed) {
      process.kill();
    }
    this.processes.delete(sessionId);
    this.clients.delete(sessionId);
  }
}
```

## API Routes

### api/routes/events.ts (SSE Endpoint)

```typescript
import { Router } from 'express';
import { OpenCodeBridge, OpenCodeEvent } from '../../lib/opencode-bridge';

const router = Router();
const bridge = new OpenCodeBridge();

// Mapa para trackear conexiones SSE activas
const sseConnections: Map<string, any[]> = new Map();

// Escuchar todos los eventos del bridge y reenviar a conexiones SSE
bridge.on('event', (event: OpenCodeEvent) => {
  const connections = sseConnections.get(event.sessionId) || [];
  const sseData = `data: ${JSON.stringify(event)}\n\n`;

  connections.forEach((res) => {
    res.write(sseData);
  });
});

/**
 * GET /events/:sessionId
 * Endpoint SSE para recibir eventos de OpenCode en tiempo real
 */
router.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // Configurar headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Agregar conexión al mapa
  if (!sseConnections.has(sessionId)) {
    sseConnections.set(sessionId, []);
  }
  sseConnections.get(sessionId)!.push(res);

  // Enviar evento de conexión establecida
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    sessionId,
    timestamp: new Date(),
  })}\n\n`);

  // Cleanup al cerrar conexión
  req.on('close', () => {
    const conns = sseConnections.get(sessionId) || [];
    const index = conns.indexOf(res);
    if (index > -1) {
      conns.splice(index, 1);
    }
    if (conns.length === 0) {
      sseConnections.delete(sessionId);
    }
  });
});

export { router, bridge };
```

### api/routes/command.ts

```typescript
import { Router } from 'express';
import { bridge } from './events';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface CommandRequest {
  prompt: string;
  contextId?: string;         // Project context folder (e.g., "promo-mayo-2024")
  sessionId?: string;         // Optional: reuse session
  taskType?: 'idea' | 'code' | 'editing' | 'economy';
}

interface CommandResponse {
  sessionId: string;
  status: 'started' | 'error';
  message: string;
}

/**
 * POST /command
 * Inicia una sesión ACP y envía un prompt
 */
router.post('/', async (req, res) => {
  try {
    const { prompt, contextId, sessionId: existingSessionId, taskType } = req.body as CommandRequest;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const sessionId = existingSessionId || uuidv4();

    if (!existingSessionId && contextId) {
      // Crear nueva sesión con el contextId del proyecto
      await bridge.createSession(sessionId, contextId);
    }

    // El prompt puede referenciar el contexto en projects/{contextId}/
    const fullPrompt = contextId
      ? `Contexto: projects/${contextId}/\n\n${prompt}`
      : prompt;

    await bridge.sendPrompt(sessionId, fullPrompt, {
      taskType,
    });

    const response: CommandResponse = {
      sessionId,
      status: 'started',
      message: 'Command sent to OpenCode. Listen to SSE for events.',
    };

    res.json(response);

  } catch (error) {
    console.error('Command error:', error);
    res.status(500).json({
      sessionId: '',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /command/:sessionId
 * Cierra una sesión ACP
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await bridge.closeSession(sessionId);
    res.json({ status: 'closed', sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close session' });
  }
});

export default router;
```

## React Hook

### src/hooks/useOpenCode.ts

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';

export interface OpenCodeStreamEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'reasoning' | 'error' | 'done' | 'connected';
  sessionId: string;
  data: any;
  timestamp: string;
}

export interface UseOpenCodeOptions {
  apiUrl?: string;
  onEvent?: (event: OpenCodeStreamEvent) => void;
  onText?: (text: string) => void;
  onToolCall?: (tool: any) => void;
  onError?: (error: string) => void;
  onDone?: () => void;
}

export function useOpenCode(options: UseOpenCodeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const apiUrl = options.apiUrl || 'http://localhost:3000';

  const sendCommand = useCallback(async ({
    prompt,
    contextId,
    taskType,
  }: {
    prompt: string;
    contextId?: string;  // Project context folder (e.g., "promo-mayo-2024")
    taskType?: 'idea' | 'code' | 'editing' | 'economy';
  }) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          contextId,
          sessionId,
          taskType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send command');
      }

      const result = await response.json();
      const newSessionId = result.sessionId;
      setSessionId(newSessionId);

      connectSSE(newSessionId);
      return newSessionId;

    } catch (error) {
      setIsLoading(false);
      options.onError?.(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [apiUrl, sessionId, options]);

  const connectSSE = useCallback((sid: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${apiUrl}/events/${sid}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setIsLoading(false);
    };

    es.onmessage = (event) => {
      try {
        const data: OpenCodeStreamEvent = JSON.parse(event.data);
        options.onEvent?.(data);

        switch (data.type) {
          case 'text':
            if (data.data.role === 'assistant' && data.data.content) {
              options.onText?.(data.data.content);
            }
            break;
          case 'tool_call':
            options.onToolCall?.(data.data);
            break;
          case 'error':
            options.onError?.(data.data);
            break;
          case 'done':
            setIsConnected(false);
            options.onDone?.();
            es.close();
            break;
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };

    es.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
      options.onError?.('Connection error');
    };
  }, [apiUrl, options]);

  const closeSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      await fetch(`${apiUrl}/command/${sessionId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to close session:', error);
    }

    eventSourceRef.current?.close();
    setSessionId(null);
    setIsConnected(false);
  }, [apiUrl, sessionId]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return {
    sendCommand,
    closeSession,
    isConnected,
    isLoading,
    sessionId,
  };
}
```
