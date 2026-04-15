# T-007 Update Exports

## Objective

Actualizar exports en `index.ts` para incluir nuevos tipos y funciones.

## Requirements Covered

- N/A (infraestructura)

## Dependencies

- `T-005`, `T-006` (implementación completa)

## Files or Areas Involved

- `api/core/opencode/index.ts` - Modify - Actualizar exports

## Actions

1. Exportar nuevos tipos (`StructuredPromptRequest`, etc.)
2. Exportar `StructuredOutputError`
3. Verificar que todo se exporta correctamente

## Completion Criteria

- [ ] Nuevos tipos exportados
- [ ] `StructuredOutputError` exportado
- [ ] Imports funcionan desde fuera del módulo

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Mantener backward compatibility en exports existentes
