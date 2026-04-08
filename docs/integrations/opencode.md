# OpenCode Integration

## Overview

OpenCode puede integrarse de tres formas diferentes:

| Method | Complexity | Real-time | Use Case |
|--------|-----------|-----------|----------|
| **ACP (Agent Client Protocol)** | High | Yes | Persistent sessions |
| **CLI Run Mode** | Low | No | One-shot execution |
| **Skill + HTTP** | Medium | Partial | Reusable integration |

## Recommended: ACP with Event Stream

Para el Video Pipeline System, recomendamos **ACP con SSE (Server-Sent Events)** para streaming de eventos al frontend.

### Architecture

```
┌─────────────────┐     SSE      ┌──────────────────┐     ACP      ┌──────────────┐
│  React Frontend │◄─────────────│  Express API     │◄────────────►│   OpenCode   │
│  (EventSource)  │              │                  │   (stdio)    │  opencode acp│
└─────────────────┘              │  • OpenCodeBridge│              └──────────────┘
                                 │  • EventEmitter  │
                                 │  • SSE Endpoint  │
                                 └──────────────────┘
```

### Event Flow

```
1. POST /command { prompt, contextId }
   ↓
2. spawn('opencode', ['acp'])  // Always from workspace root
   ↓
3. ACP Client connect (stdin/stdout)
   ↓
4. sendMessage({ role: 'user', content: prompt, context: { contextId } })
   ↓
5. ← onMessage() receives responses
   ↓
6. bridge.emit('event', { type, data })
   ↓
7. SSE → res.write() → Frontend
```

### Event Types

| Event Type | Description |
|------------|-------------|
| `text` | Text response from assistant |
| `tool_call` | Tool invocation |
| `tool_result` | Tool execution result |
| `reasoning` | Reasoning/thinking content |
| `error` | Error message |
| `done` | Session ended |
| `connected` | SSE connection established |

## ACP Protocol

### Initialization

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "name": "video-pipeline-agent",
    "version": "1.0.0"
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocol_version": "0.1.0",
    "capabilities": ["tools", "resources"]
  }
}
```

### Message Exchange

```json
// Client → Agent
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "session/prompt",
  "params": {
    "prompt": "Generate video idea for...",
    "context": { "contextId": "promo-mayo-2024" }
  }
}

// Agent → Client (streaming)
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "role": "assistant",
    "content": "Here's a video idea...",
    "tool_calls": [...]
  }
}
```

## SDK References

### Official ACP SDK

```bash
npm install @agentclientprotocol/sdk
```

**Package**: `@agentclientprotocol/sdk`
**Repo**: https://github.com/agentclientprotocol/typescript-sdk
**Docs**: https://agentclientprotocol.com/libraries/typescript

### Key Classes

```typescript
import { AcpClient, Message } from '@agentclientprotocol/sdk';

// Create client connected to process stdio
// Note: OpenCode always runs from workspace root
const client = new AcpClient({
  stdin: process.stdin,
  stdout: process.stdout,
});

// Listen for messages
client.onMessage((message: Message) => {
  console.log('Received:', message);
});

// Send message with context reference
await client.sendMessage({
  role: 'user',
  content: 'Genera una idea de video',
  context: { contextId: 'promo-mayo-2024' }, // References projects/{contextId}/
});

// Initialize session
await client.initialize({
  name: 'video-pipeline-agent',
  version: '1.0.0',
});

// Shutdown
await client.shutdown();
```

## OpenCode ACP Mode

```bash
# Start OpenCode in ACP server mode (always from workspace root)
opencode acp
```

**Environment Variables**:
- `OPENCODE_API_KEY` - API key for OpenCode
- `OPENCODE_CONFIG_CONTENT` - Inline config (JSON)
- `OPENCODE_BIN` - Path to binary

**Context Access**:
OpenCode se ejecuta siempre desde el workspace/ y accede al contexto mediante referencias a carpetas:

```typescript
// El prompt referencia la carpeta del proyecto
const prompt = `
  Lee el contexto en projects/promo-mayo-2024/ y genera una idea.
  
  Archivos disponibles:
  - projects/promo-mayo-2024/system.md
  - projects/promo-mayo-2024/brand.md
  - projects/promo-mayo-2024/audience.md
  
  Prompt del usuario: ${userPrompt}
`;
```

## Comparison: ACP vs CLI Run vs Skill

### Option 1: ACP (Recommended for Pipeline)

**Pros:**
- Persistent session with context
- Real-time streaming
- Bidirectional communication
- Multiple tool calls in session

**Cons:**
- Complex implementation
- Process management required
- Reconnection handling needed

### Option 2: CLI Run

**Pros:**
- Simple implementation
- JSON output
- No process management

**Cons:**
- No streaming
- Stateless (no conversation)
- Cold start latency

### Option 3: Skill + HTTP

**Pros:**
- Reusable across projects
- Standard HTTP
- Easy debugging

**Cons:**
- Additional latency
- Requires skill maintenance
- Version synchronization

## Configuration

### config.yaml

```yaml
opencode:
  mode: 'acp'  # 'acp' | 'cli' | 'skill'
  timeout: 180000  # 3 minutes
  retries: 2

  # ACP-specific
  acp:
    reconnect: true
    max_reconnects: 3

  # Context paths for OpenCode to read
  # Note: Context is now project-based via projects/{contextId}/
  # See Architecture > Context Convention for details
```

## Unified Agent UI Strategy

El Video Pipeline System implementa una **estrategia de agente unificado** donde un único panel de OpenCode persiste across todas las pantallas.

### Key Features

| Feature | Description |
|---------|-------------|
| **Persistent Panel** | Panel de agente fijo a la derecha en todas las pantallas |
| **Header Status** | Indicador de estado siempre visible en el header |
| **Open in Web** | Botón para abrir sesión en OpenCode Web |
| **Context Awareness** | El agente conoce el proyecto/video/escena actual |
| **Background Execution** | OpenCode sigue ejecutándose si el usuario cierra el tab |

### Header Status Indicator

```typescript
// Siempre visible en el header
<div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
  <span className="text-xs text-slate-300">OpenCode</span>
  <span className="text-xs text-green-400">● acp-7f8d9a2e</span>
</div>
```

### Open in Web

El usuario puede abrir la sesión actual en OpenCode Web:

```typescript
// Generar URL para web
function generateWebUrl(sessionId: string, contextId: string): string {
  const baseUrl = process.env.OPENCODE_WEB_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    session_hint: sessionId,
    context: contextId,
    source: 'video-pipeline',
  });
  return `${baseUrl}/?${params.toString()}`;
}

// API: GET /sessions/:id/web-url
router.get('/sessions/:id/web-url', (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  const webUrl = generateWebUrl(session.id, session.contextId);
  res.json({ sessionId: session.id, webUrl });
});
```

### Background Execution

OpenCode puede ejecutarse en background usando diferentes modos:

```bash
# ACP mode (stdio) - usado por el pipeline
opencode acp

# Serve mode - HTTP API headless
opencode serve --port 8080

# Web mode - con UI integrada
opencode web --port 3000
```

El Session Manager mantiene el proceso vivo incluso si el frontend se desconecta:

```typescript
// Health check periódico
isHealthy(sessionId: string): boolean {
  const metadata = this.sessions.get(sessionId);
  try {
    process.kill(metadata.pid!, 0);  // Verifica si proceso existe
    return true;
  } catch {
    return false;
  }
}
```

### Documentation

Para más detalles sobre la implementación completa:

- [Unified Agent UI](../architecture/unified-agent-ui.md) - Documentación completa del patrón
- [Session Manager](./session-manager.md) - Gestión de sesiones con metadatos
