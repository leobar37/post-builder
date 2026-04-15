# T-003 Verify Projects CRUD

## Objective

Verify that projects CRUD operations work end-to-end via the API.

## Requirements Covered

- `FR-003` - Projects CRUD operations

## Dependencies

- `T-001` (API must be running)

## Files or Areas Involved

- `api/routes/projects.ts` - **Review** - Verify route handlers
- `api/services/project.service.ts` - **Review** - Verify business logic
- `api/db/repositories/project.repository.ts` - **Review** - Verify data access
- `src/hooks/useProjects.ts` - **Review** - Verify frontend usage

## Actions

1. Start the API server: `pnpm run dev:api`
2. Test health endpoint: `curl http://localhost:3458/health`
3. Test creating a project:
   ```bash
   curl -X POST http://localhost:3458/api/projects \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Project","description":"Test","context_id":"test-001"}'
   ```
4. Test listing projects: `curl http://localhost:3458/api/projects`
5. Test getting single project: `curl http://localhost:3458/api/projects/<id>`
6. Test updating project: `curl -X PATCH http://localhost:3458/api/projects/<id> -H "Content-Type: application/json" -d '{"name":"Updated Name"}'`
7. Test deleting project: `curl -X DELETE http://localhost:3458/api/projects/<id>`
8. Verify all CRUD operations return correct status codes and data

## Completion Criteria

- All CRUD operations return expected status codes (200, 201, 204, 404, 500)
- Data is correctly persisted and retrieved
- No server errors in API logs
- `pnpm typecheck` still passes after any changes

## Validation

- Run each curl command and verify:
  - Create returns `201` with `{"success":true,"project":{...}}`
  - List returns `200` with `{"projects":[...],"total":...}`
  - Get returns `200` with project object
  - Update returns `200` with updated project
  - Delete returns `200` with `{"success":true}`
  - Getting deleted project returns `404`

## Risks or Notes

- Projects require context files in `data/contexts/<context_id>/` (system.md, brand.md, audience.md) - service warns but doesn't fail if missing
- Database is SQLite at `data/reels.db`
