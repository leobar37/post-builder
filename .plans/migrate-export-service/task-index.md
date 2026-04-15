# Migrate Export Service - Task Index

## Summary

- **Mode**: Structured
- **Slug**: `migrate-export-service`
- **Requirements File**: `requirements.md`
- **Checklist File**: `checklist.json`

## Requirements Coverage

| Requirement | Covered By |
| --- | --- |
| `FR-001` | `tasks/01-fix-export-routes-css.md` |
| `FR-002` | `tasks/01-fix-export-routes-css.md` |
| `FR-003` | `tasks/03-verify-projects-crud.md` |
| `FR-004` | `tasks/04-verify-videos-crud.md` |
| `FR-005` | `tasks/01-fix-export-routes-css.md` |
| `NFR-001` | All tasks (verify via `pnpm typecheck`) |
| `NFR-002` | `tasks/02-cleanup-app-tsx.md` |

## Task List

| Task ID | File | Purpose | Dependencies |
| --- | --- | --- | --- |
| `T-001` | `tasks/01-fix-export-routes-css.md` | Fix API startup by removing deleted CSS file reads | none |
| `T-002` | `tasks/02-cleanup-app-tsx.md` | Remove mixed backend code and dead code from App.tsx | none |
| `T-003` | `tasks/03-verify-projects-crud.md` | Verify projects CRUD operations work end-to-end | `T-001` |
| `T-004` | `tasks/04-verify-videos-crud.md` | Verify videos CRUD operations work end-to-end | `T-001`, `T-003` |

## Suggested Execution Order

1. `T-001` - Must be done first to unblock API startup
2. `T-002` - Can be done in parallel with T-001 (cleaning up the file independently)
3. `T-003` - Requires API to be running (depends on T-001)
4. `T-004` - Depends on T-001 (API running) and logically follows T-003

## Notes

- T-001 and T-002 can be executed in parallel if two developers are available
- T-003 and T-004 should be sequential since they share the same running API server
- After all tasks complete, run `pnpm run dev` to verify full stack works
