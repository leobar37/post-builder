# T-003 Update OpenCodeSDK

## Objective

Actualizar `OpenCodeSDK` para usar el nuevo `AcpClient` basado en SDK oficial.

## Requirements Covered

- `FR-003`

## Dependencies

- `T-002` (AcpClient refactorizado)

## Files or Areas Involved

- `api/core/opencode/sdk.ts` - Modify - Actualizar uso de AcpClient

## Actions

1. Verificar que `OpenCodeSDK` funciona con nuevo `AcpClient`
2. Mantener todos los métodos públicos existentes
3. Preservar manejo de eventos
4. Mantener `ModelRegistry` (no se modifica)

## Completion Criteria

- [ ] `OpenCodeSDK` compila sin errores
- [ ] Métodos `connect()`, `disconnect()`, `sendPrompt()` funcionan
- [ ] `listModels()`, `listProviders()` siguen funcionando
- [ ] Eventos se emiten correctamente

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- La interfaz pública debe mantenerse exactamente igual
- Los consumidores actuales no deben notar cambios
