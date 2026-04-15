# T-008 Validate Typecheck

## Objective

Validar que todo el código pasa typecheck sin errores.

## Requirements Covered

- `NFR-001`

## Dependencies

- `T-007` (todos los cambios completados)

## Files or Areas Involved

- Todos los archivos en `api/core/opencode/`

## Actions

1. Ejecutar `pnpm typecheck`
2. Resolver cualquier error de TypeScript
3. Verificar que no hay warnings críticos

## Completion Criteria

- [ ] `pnpm typecheck` pasa sin errores
- [ ] No hay errores de tipo en archivos modificados
- [ ] Build puede completarse

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Si hay errores, regresar a tareas anteriores
- Priorizar fix de errores sobre warnings
