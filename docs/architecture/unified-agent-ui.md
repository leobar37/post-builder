# Unified Agent UI Strategy

## Overview

El sistema implementa una **estrategia de agente unificado** donde un único panel de agente persiste across todas las pantallas de la aplicación. Esto proporciona consistencia UX y permite al usuario interactuar con OpenCode desde cualquier contexto sin perder el hilo de la conversación.

## Core Principles

1. **Single Agent Instance**: Un único panel de agente visible en todo momento
2. **Persistent Context**: La sesión de OpenCode se mantiene activa mientras navegas
3. **Universal Access**: El agente está disponible desde cualquier pantalla
4. **Status Visibility**: Estado de conexión siempre visible en el header
5. **Web Integration**: Capacidad de abrir la sesión en OpenCode Web

## UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header                                                   [Status]  │
│  OpenCode ● acp-7f8d9a2e                              [Abrir Web]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────┐  ┌──────────────────────┐ │
│  │                                     │  │    AGENT PANEL       │ │
│  │      SCREEN CONTENT                 │  │  ┌────────────────┐  │ │
│  │      (Video List / Editor /         │  │  │ Status: ●      │  │ │
│  │       Preview / Export)             │  │  │ Session: xxx   │  │ │
│  │                                     │  │  │ [Abrir en Web] │  │ │
│  │                                     │  │  └────────────────┘  │ │
│  │                                     │  │                      │ │
│  │      flex-1                         │  │  Context: promo-2024 │ │
│  │      (adapts to screen)             │  │  Model: Claude Opus  │ │
│  │                                     │  │                      │ │
│  │                                     │  │  ──────────────────  │ │
│  │                                     │  │  User: Genera idea   │ │
│  │                                     │  │  Agent: Generando... │ │
│  │                                     │  │  Tool: generate_idea │ │
│  │                                     │  │                      │ │
│  │                                     │  │  ──────────────────  │ │
│  │                                     │  │  [Input message...]  │ │
│  │                                     │  │  [+Ctx] [Reconnect]  │ │
│  │                                     │  │                      │ │
│  │                                     │  │  Quick actions:      │ │
│  │                                     │  │  [Gen] [Edit] [Code] │ │
│  │                                     │  └──────────────────────┘ │ │
│  └─────────────────────────────────────┘           w-80            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Structure

### Header Status Indicator

```typescript
// components/AgentStatusHeader.tsx
interface AgentStatusHeaderProps {
  sessionId: string;
  status: 'connected' | 'disconnected' | 'error';
  onOpenWeb: () => void;
}

// Visual:
// ┌────────────────────────────────────────────────────┐
// │ OpenCode ● acp-7f8d9a2e                    [🌐]   │
// │         ↑green dot          Abrir en Web (icon)    │
// └────────────────────────────────────────────────────┘
```

### Agent Panel (Persistent Sidebar)

```typescript
// components/AgentPanel.tsx
interface AgentPanelProps {
  sessionId: string;
  contextId: string;
  model: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onOpenWeb: () => void;
  onReconnect: () => void;
}

// Layout:
// <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
//   <AgentPanelHeader />
//   <AgentStatusBar />
//   <MessageHistory />
//   <AgentInput />
//   <QuickActions />
// </aside>
```

### Main Layout

```typescript
// layouts/MainLayout.tsx
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <main className="flex">
        <div className="flex-1">{children}</div>
        <AgentPanel />
      </main>
    </div>
  );
}
```

## Session Status Display

### Status States

| Status | Indicator | Color | Action Available |
|--------|-----------|-------|------------------|
| Connected | ● | Green | Abrir en Web |
| Connecting | ◐ | Yellow | Cancelar |
| Disconnected | ○ | Gray | Reconectar |
| Error | ✕ | Red | Reconectar |

### Header Integration

```typescript
// El status se muestra en el header global
function Header() {
  const { session } = useAgentSession();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-900">
      <div className="flex items-center gap-2">
        <Logo />
        <ProjectSelector />
      </div>

      {/* Agent Status - Always Visible */}
      <div className="flex items-center gap-4">
        {session && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${
              session.status === 'running' ? 'bg-green-500 animate-pulse' :
              session.status === 'error' ? 'bg-red-500' :
              'bg-slate-500'
            }`} />
            <span className="text-xs text-slate-300">OpenCode</span>
            <span className="text-xs text-green-400 font-mono">
              ● {session.id.slice(0, 8)}
            </span>
          </div>
        )}

        <button
          onClick={openInWeb}
          className="text-slate-400 hover:text-white"
          title="Abrir en OpenCode Web"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
```

## Open in Web Functionality

### OpenCode CLI Commands

OpenCode soporta múltiples modos de ejecución:

```bash
# ACP mode (stdio) - usado por el pipeline
opencode acp

# Serve mode (headless HTTP server)
opencode serve --port 8080

# Web mode (con UI web integrada)
opencode web --port 3000
```

### Web URL Generation

```typescript
// lib/opencode/web-integration.ts

/**
 * Genera URL para abrir sesión en OpenCode Web
 */
export function generateWebUrl(sessionId: string, contextId: string): string {
  const baseUrl = process.env.OPENCODE_WEB_URL || 'http://localhost:3000';

  // Parámetros para restaurar contexto en web
  const params = new URLSearchParams({
    session_hint: sessionId,
    context: contextId,
    source: 'video-pipeline',
  });

  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Abre sesión en navegador del usuario
 */
export async function openInWeb(sessionId: string, contextId: string): Promise<void> {
  const url = generateWebUrl(sessionId, contextId);

  // En backend: retornar URL al frontend
  // En frontend: window.open(url, '_blank')

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
```

### API Endpoint

```typescript
// api/routes/sessions.ts

// GET /sessions/:id/web-url
router.get('/sessions/:id/web-url', (req, res) => {
  const { id } = req.params;
  const session = sessionManager.getSession(id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const webUrl = generateWebUrl(id, session.contextId);

  res.json({
    sessionId: id,
    webUrl,
    contextId: session.contextId,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
  });
});
```

## Message History Display

### Message Types

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: {
    toolName?: string;
    toolResult?: any;
    reasoning?: string;
  };
}
```

### Message Rendering

```typescript
// components/MessageHistory.tsx
function MessageHistory({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  switch (message.role) {
    case 'user':
      return (
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
            U
          </div>
          <div className="bg-blue-500/10 rounded-lg p-2 text-sm text-slate-300 flex-1">
            {message.content}
          </div>
        </div>
      );

    case 'assistant':
      return (
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Bot className="w-3 h-3 text-white" />
          </div>
          <div className="bg-slate-800 rounded-lg p-2 text-sm text-slate-300 flex-1">
            {message.content}
          </div>
        </div>
      );

    case 'tool':
      return (
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
            <Wrench className="w-3 h-3 text-white" />
          </div>
          <div className="bg-purple-500/10 rounded-lg p-2 text-sm text-slate-300 flex-1">
            <div className="text-xs text-purple-400 mb-1">
              Tool: {message.metadata?.toolName}
            </div>
            {message.content}
          </div>
        </div>
      );
  }
}
```

## Quick Actions

### Context-Aware Actions

```typescript
// Quick actions cambian según el contexto actual
const QUICK_ACTIONS = {
  // Pantalla de lista de videos
  videoList: [
    { label: 'Generar idea', icon: 'sparkles', prompt: 'Genera una nueva idea de video' },
    { label: 'Analizar proyecto', icon: 'chart', prompt: 'Analiza el contexto del proyecto' },
  ],

  // Pantalla de edición de video
  videoEdit: [
    { label: 'Editar escena', icon: 'edit', prompt: 'Ayúdame a mejorar esta escena' },
    { label: 'Generar código', icon: 'code', prompt: 'Genera código para esta escena' },
  ],

  // Pantalla de preview
  preview: [
    { label: 'Optimizar', icon: 'zap', prompt: 'Optimiza este video' },
    { label: 'Cambiar estilo', icon: 'palette', prompt: 'Cambia el estilo visual' },
  ],
};

// Componente
function QuickActions({ currentScreen }: { currentScreen: string }) {
  const actions = QUICK_ACTIONS[currentScreen] || QUICK_ACTIONS.videoList;
  const { sendMessage } = useAgent();

  return (
    <div className="p-3 border-t border-slate-700 bg-slate-800/50">
      <div className="text-xs text-slate-500 mb-2">Acciones rápidas:</div>
      <div className="flex flex-wrap gap-1">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.prompt)}
            className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full hover:bg-slate-600"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## Backend Integration

### Session Status Endpoint

```typescript
// GET /api/sessions/:id
router.get('/sessions/:id', (req, res) => {
  const { id } = req.params;

  const metadata = sessionManager.getSession(id);
  if (!metadata) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const isHealthy = sessionManager.isHealthy(id);
  const lastMessage = sessionManager.getLastMessage(id);

  res.json({
    id: metadata.id,
    contextId: metadata.contextId,
    status: metadata.status,
    isHealthy,
    messageCount: metadata.messageCount,
    startedAt: metadata.startedAt,
    lastActivityAt: metadata.lastActivityAt,
    lastMessage,
    model: metadata.modelConfig,
  });
});
```

### SSE Events to Frontend

```typescript
// lib/sse/agent-events.ts

sessionManager.on('event', (event: SessionEvent) => {
  // Reenviar a conexiones SSE del frontend
  const sseData = `data: ${JSON.stringify({
    type: event.type,
    sessionId: event.sessionId,
    data: event.data,
    timestamp: event.timestamp,
  })}\n\n`;

  // Enviar a todos los clientes suscritos a este sessionId
  const connections = sseConnections.get(event.sessionId);
  connections?.forEach((res) => res.write(sseData));
});
```

## State Management

### React Hook: useAgentSession

```typescript
// hooks/useAgentSession.ts

interface AgentSessionState {
  sessionId: string | null;
  contextId: string | null;
  status: 'idle' | 'connecting' | 'running' | 'error';
  messages: Message[];
  isWebAvailable: boolean;
}

export function useAgentSession() {
  const [state, setState] = useState<AgentSessionState>({
    sessionId: null,
    status: 'idle',
    messages: [],
    isWebAvailable: false,
  });

  // Conectar a SSE
  useEffect(() => {
    if (!state.sessionId) return;

    const eventSource = new EventSource(`/api/sessions/${state.sessionId}/events`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleEvent(data);
    };

    return () => eventSource.close();
  }, [state.sessionId]);

  const sendMessage = async (content: string) => {
    if (!state.sessionId) return;

    await fetch(`/api/sessions/${state.sessionId}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: content }),
    });
  };

  const openInWeb = async () => {
    if (!state.sessionId) return;

    const response = await fetch(`/api/sessions/${state.sessionId}/web-url`);
    const { webUrl } = await response.json();

    window.open(webUrl, '_blank');
  };

  return {
    ...state,
    sendMessage,
    openInWeb,
  };
}
```

## Background Execution

### OpenCode in Background

OpenCode puede ejecutarse en background sin problemas:

```typescript
// El proceso ACP sigue corriendo incluso si el usuario
// cierra el tab del navegador

async function createPersistentSession(contextId: string) {
  const sessionId = uuidv4();

  // Crear sesión - el proceso sigue en background
  await sessionManager.createSession(sessionId, contextId);

  // El session manager hace health checks periódicos
  // y mantiene el proceso vivo

  return sessionId;
}

// Incluso si el frontend se desconecta, al reconectar:
async function reconnectToSession(sessionId: string) {
  const session = sessionManager.getSession(sessionId);

  if (session && sessionManager.isHealthy(sessionId)) {
    // Recuperar historial de mensajes desde la sesión
    const lastMessage = sessionManager.getLastMessage(sessionId);

    return {
      sessionId,
      status: session.status,
      lastMessage,
      messageCount: session.messageCount,
    };
  }

  // Si no está healthy, crear nueva sesión
  throw new Error('Session not available');
}
```

## Best Practices

1. **Session Persistence**: Mantener sesión activa durante toda la sesión del usuario
2. **Reconnection**: Permitir reconexión a sesiones existentes
3. **Graceful Degradation**: Si OpenCode falla, mostrar estado de error claro
4. **Message History**: Persistir mensajes en UI durante la navegación
5. **Context Switching**: Actualizar contextId cuando el usuario cambia de proyecto

## See Also

- [Session Manager](../integrations/session-manager.md) - Gestión de sesiones ACP
- [OpenCode Integration](../integrations/opencode.md) - Integración con ACP
- [Context Convention](./context-convention.md) - Convención de carpetas projects/{contextId}/
