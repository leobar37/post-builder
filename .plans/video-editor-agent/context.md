# Context: Video Editor Agent

## Visión General

Construir un sistema de agente IA propio (`VideoEditorAgent`) que actúa como intermediario inteligente entre el usuario y los servicios de generación de video. El agente utiliza AI SDK para streaming de texto y puede invocar tools (incluyendo OpenCode vía ACP) cuando necesita generar o editar código.

## Arquitectura de Alto Nivel

```
┌─────────────────┐     HTTP/SSE      ┌──────────────────┐     Tool Calls     ┌─────────────┐
│   Frontend      │◄─────────────────►│  VideoEditorAgent│◄─────────────────►│  OpenCode   │
│  (TanStack Query│    streamText      │   (AI SDK)       │   (ACP Client)   │   (ACP)     │
│   useChat)      │                   │                  │                  │             │
└─────────────────┘                   └──────────────────┘                  └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │   Hono API  │
                                       │   (Routes)  │
                                       └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │   SQLite    │
                                       │   (State)   │
                                       └─────────────┘
```

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| Frontend | TanStack Query + AI Elements | Manejo de estado server, streaming nativo |
| API Framework | Hono | Lightweight, edge-ready, mejor DX que Express |
| AI Runtime | AI SDK (Vercel) | Streaming, tool calling, multi-provider |
| LLM | Claude/GPT-4 | Configurable vía env vars |
| OpenCode Integration | ACP Client | Tool específica para generación de código |
| Database | SQLite | Sessions, mensajes, estado de escenas |

## Concepto de Sesión

Una **escena** es una **sesión** del agente. Esto permite:
- Historial de conversación por escena
- Contexto persistente entre mensajes
- Múltiples intentos/iteraciones sobre la misma escena
- Recuperación de sesiones anteriores

```typescript
interface SceneSession {
  sessionId: string;      // ID único de sesión
  sceneId: string;        // Referencia a la escena en DB
  videoId: string;        // Contexto del video padre
  projectId: string;      // Contexto del proyecto
  messages: Message[];    // Historial de chat
  toolsUsed: ToolCall[];  // Registro de tools invocadas
  createdAt: Date;
  updatedAt: Date;
}
```

## Skills Strategy

Este plan implementa la base para un ecosistema de skills. La arquitectura debe permitir:

1. **Skills como Plugins**: Nuevos tools pueden registrarse dinámicamente
2. **System Prompts Modulares**: Cada skill puede inyectar contexto al system prompt
3. **Multi-Agent**: Extensible a múltiples agentes especializados

```typescript
// Ejemplo de extensión futura
interface Skill {
  name: string;
  tools: Tool[];
  injectContext: (session: Session) => string;
}

// Skills futuros:
// - ScriptWritingSkill: Genera guiones de voz
// - AudioGenerationSkill: Genera música/efectos
// - SubtitleSkill: Genera subtítulos automáticos
```

## Deciciones Clave

| Decisión | Opción | Razón |
|----------|--------|-------|
| Framework API | Hono | Reemplaza Express, más moderno, mejor performance |
| Frontend State | TanStack Query | Mejor que useChat básico, manejo de cache/refetch |
| AI SDK | Vercel AI SDK | Standard para streaming, tool calling, multi-provider |
| OpenCode | Tool, no backend directo | Flexibilidad para cambiar de modelo/servicio |
| Sesiones | Scene = Session | Modelado natural del dominio |

## Integración con Código Existente

- **Mantiene**: `api/core/opencode/` - ACP client se usa como tool
- **Migra**: `api/index.ts` - De Express a Hono
- **Nuevo**: `src/agent/` - Core del sistema de agentes
- **Nuevo**: `app/api/agent/` - API routes con Hono

## Referencias

- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Hono Documentation](https://hono.dev)
- [TanStack Query](https://tanstack.com/query/latest)
- OpenCode ACP: `api/core/opencode/acp-client.ts`
