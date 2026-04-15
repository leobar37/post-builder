# T-006 Add JSON Validation

## Objective

Agregar validación de respuestas JSON usando Zod.

## Requirements Covered

- `FR-006`

## Dependencies

- `T-004` (Tipos agregados)

## Files or Areas Involved

- `api/core/opencode/validation.ts` - Modify - Agregar validadores
- `api/core/opencode/sdk.ts` - Modify - Usar validación

## Actions

1. Crear función `validateStructuredOutput<T>()`
2. Usar Zod para validar contra schema
3. Integrar en `sendPromptStructured()`
4. Agregar mensajes de error útiles

## Completion Criteria

- [ ] Validación con Zod funciona
- [ ] Errores indican qué campo falló
- [ ] Performance acceptable (no bloquea)

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Zod ya está instalado en el proyecto
- Validación debe ser opcional (schema puede ser partial)
