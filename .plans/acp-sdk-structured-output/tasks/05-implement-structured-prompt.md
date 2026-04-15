# T-005 Implement Structured Prompt

## Objective

Implementar método `sendPromptStructured()` con soporte para JSON schema y retry automático.

## Requirements Covered

- `FR-005`, `FR-007`

## Dependencies

- `T-003` (OpenCodeSDK actualizado)
- `T-004` (Tipos agregados)

## Files or Areas Involved

- `api/core/opencode/sdk.ts` - Modify - Agregar método

## Actions

1. Agregar método `sendPromptStructured<T>()`
2. Aceptar `schema` y `retryCount` en options
3. Implementar retry loop (máximo 2 intentos por defecto)
4. Parsear respuesta como JSON
5. Si falla, reintentar con prompt modificado

## Completion Criteria

- [ ] Método `sendPromptStructured()` funciona
- [ ] Retry automático funciona (2 intentos)
- [ ] Devuelve `Promise<T>` con tipo genérico
- [ ] Errores de parsing son catchables

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- El retry debe ser transparente para el usuario
- Si todos los retries fallan, lanzar `StructuredOutputError`
