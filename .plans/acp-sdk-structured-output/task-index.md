# ACP SDK + Structured Output - Task Index

## Summary

- Mode: Structured
- Slug: `acp-sdk-structured-output`
- Requirements File: `requirements.md`
- Checklist File: `checklist.json`

## Requirements Coverage

| Requirement | Covered By |
| --- | --- |
| `FR-001` | `tasks/01-install-acp-sdk.md` |
| `FR-002` | `tasks/02-refactor-acp-client.md` |
| `FR-003` | `tasks/03-update-opencode-sdk.md` |
| `FR-004` | `tasks/04-add-structured-types.md` |
| `FR-005` | `tasks/05-implement-structured-prompt.md` |
| `FR-006` | `tasks/06-add-json-validation.md` |
| `FR-007` | `tasks/05-implement-structured-prompt.md` |
| `FR-008` | `tasks/04-add-structured-types.md` |

## Task List

| Task ID | File | Purpose | Dependencies |
| --- | --- | --- | --- |
| `T-001` | `tasks/01-install-acp-sdk.md` | Instalar @agentclientprotocol/sdk | none |
| `T-002` | `tasks/02-refactor-acp-client.md` | Refactorizar AcpClient para usar SDK oficial | `T-001` |
| `T-003` | `tasks/03-update-opencode-sdk.md` | Actualizar OpenCodeSDK para usar nuevo AcpClient | `T-002` |
| `T-004` | `tasks/04-add-structured-types.md` | Agregar tipos para structured output | `T-001` |
| `T-005` | `tasks/05-implement-structured-prompt.md` | Implementar sendPromptStructured() con retry | `T-003`, `T-004` |
| `T-006` | `tasks/06-add-json-validation.md` | Agregar validación JSON con Zod | `T-004` |
| `T-007` | `tasks/07-update-exports.md` | Actualizar exports en index.ts | `T-005`, `T-006` |
| `T-008` | `tasks/08-validate-typecheck.md` | Validar con typecheck | `T-007` |

## Suggested Execution Order

1. `T-001` - Instalar SDK primero
2. `T-002` - Refactorizar cliente ACP
3. `T-004` - Agregar tipos (puede ir en paralelo con T-002)
4. `T-003` - Actualizar SDK de alto nivel
5. `T-006` - Validación JSON
6. `T-005` - Implementar structured prompt
7. `T-007` - Actualizar exports
8. `T-008` - Validación final

## Notes

- `T-002` y `T-004` pueden trabajarse en paralelo
- `T-005` depende de ambos flujos (cliente + tipos)
- La validación de typecheck debe pasar antes de considerar completo
