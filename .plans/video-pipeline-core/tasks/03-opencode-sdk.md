# T-003 OpenCode SDK

## Objective

Crear el SDK de OpenCode que abstraiga el protocolo ACP (Agent Client Protocol) permitiendo controlar OpenCode desde cualquier parte del código.

## Requirements Covered

- `FR-004` - SDK OpenCode con soporte ACP
- `FR-010` - Adaptador OpenCode que abstraiga el protocolo ACP

## Dependencies

- `T-001` - Core infrastructure
- `T-002` - Utilities

## Files or Areas Involved

- `src/core/opencode/types.ts` - Create - Tipos ACP y mensajes
- `src/core/opencode/acp-client.ts` - Create - Cliente ACP JSON-RPC
- `src/core/opencode/sdk.ts` - Create - SDK de alto nivel
- `src/core/opencode/index.ts` - Create - Exports

## Actions

1. Definir tipos ACP: `AcpMessage`, `AcpRequest`, `AcpResponse`, `AcpEvent`
2. Definir tipos para capacidades: `Tool`, `Resource`, `Prompt`
3. Crear clase `AcpClient` que maneje JSON-RPC over stdio
4. Implementar métodos: `initialize()`, `sendMessage()`, `shutdown()`
5. Manejar eventos entrantes con EventEmitter
6. Crear clase `OpenCodeSDK` de alto nivel
7. Implementar métodos: `connect()`, `disconnect()`, `sendPrompt()`, `callTool()`
8. Soportar streaming de respuestas via callbacks
9. Integrar con logger del core para debugging

## Completion Criteria

- [ ] AcpClient puede inicializar sesión con OpenCode
- [ ] Mensajes se envían y reciben correctamente
- [ ] Eventos se emiten para respuestas del agente
- [ ] SDK puede enviar prompts y recibir respuestas
- [ ] Desconexión limpia sin dejar procesos huérfanos

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- El proceso OpenCode debe spawnearse con `opencode acp`
- Manejar correctamente el cierre de stdin/stdout
- Implementar heartbeat para detectar desconexiones
- Soporte para múltiples sesiones simultáneas
