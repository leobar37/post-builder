# T-004 Add Structured Types

## Objective

Agregar tipos TypeScript para structured output (JSON schema).

## Requirements Covered

- `FR-004`, `FR-008`

## Dependencies

- `T-001` (SDK instalado)

## Files or Areas Involved

- `api/core/opencode/types.ts` - Modify - Agregar nuevos tipos

## Actions

1. Agregar `JsonSchema` interface
2. Agregar `OutputFormat` type ('text' | 'json_schema')
3. Agregar `StructuredPromptRequest` interface
4. Agregar `StructuredOutputError` class
5. Agregar `StructuredPromptResponse<T>` generic

## Completion Criteria

- [ ] Tipos exportados correctamente
- [ ] `JsonSchema` soporta propiedades anidadas
- [ ] `StructuredOutputError` extiende `AppError`

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Alinear con estándar JSON Schema
- Mantener compatibilidad con tipos existentes
