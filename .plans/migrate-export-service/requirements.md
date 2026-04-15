# Migrate Export Service - Requirements

## Objective

Fix the broken API server startup and clean up residual code from the vanilla JS migration, restoring full CRUD functionality for projects and videos.

## Scope

- **In scope**:
  - Fix `api/routes/export.routes.ts` to not read deleted CSS files
  - Remove mixed backend code from `src/App.tsx`
  - Remove dead code (unused `ApiClient`) from `src/App.tsx`
  - Verify API server starts successfully
  - Verify projects CRUD operations work
  - Verify videos CRUD operations work

- **Out of scope**:
  - New features or API endpoints
  - Database migrations or schema changes
  - Remotion video rendering pipeline
  - Browserless service configuration
  - Frontend component changes

## Functional Requirements

- `FR-001` - API server starts without errors on `pnpm run dev:api`
- `FR-002` - Health endpoint `GET /health` returns 200 OK
- `FR-003` - Projects CRUD: Create project via API, retrieve list, retrieve single, update, delete
- `FR-004` - Videos CRUD: Create video via API, retrieve list, retrieve single with scenes, delete
- `FR-005` - Export routes respond correctly (may return error if Browserless not configured, but should not crash on CSS files)

## Non-Functional Requirements

- `NFR-001` - TypeScript compiles without errors after changes
- `NFR-002` - No dead code remains in `src/App.tsx` (only React component should remain)

## Acceptance Criteria

- `pnpm run dev:api` starts successfully and responds to `/health`
- `curl http://localhost:3458/health` returns `{"status":"ok",...}`
- `src/App.tsx` contains only React component code (no Express server code)
- `pnpm typecheck` passes
- Projects can be created, listed, updated, and deleted via the API
- Videos can be created, listed, and deleted via the API

## Constraints

- Frontend and backend must remain as separate processes (no mixing in same file)
- Export functionality may return 500 if Browserless is not configured, but must not crash on missing CSS files
- Keep existing API contracts unchanged (no breaking changes to routes)

## Open Questions

- Should the export routes be kept if they're not actively used? (The React app doesn't seem to call them currently based on hooks in `useProjects`/`useVideos`)
- Is there a plan to use the export endpoint in the future, or should it be removed entirely?
