# T-002 Refactor AcpClient

## Objective

Reemplazar la implementación custom de `AcpClient` con el SDK oficial `@agentclientprotocol/sdk`.

## Requirements Covered

- `FR-002`

## Dependencies

- `T-001` (SDK instalado)

## Files or Areas Involved

- `api/core/opencode/acp-client.ts` - Modify - Refactorizar completamente

## Actions

1. Importar `ClientSideConnection` desde `@agentclientprotocol/sdk`
2. Reemplazar spawn/stdio con conexión SDK
3. Mantener interfaz pública compatible (mismos métodos)
4. Adaptar manejo de eventos al SDK
5. Mantener logging con `getLogger()`

## Completion Criteria

- [ ] `acp-client.ts` usa `@agentclientprotocol/sdk`
- [ ] Métodos `connect()`, `sendPrompt()`, `shutdown()` funcionan
- [ ] Eventos `connected`, `disconnected`, `error` se emiten correctamente
- [ ] No queda código de JSON-RPC manual

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- El SDK oficial puede tener API diferente - adaptar manteniendo compatibilidad
- Verificar que manejo de errores se preserve
- Mantener soporte para `AcpSessionConfig` (apiKey, timeout, etc.)
