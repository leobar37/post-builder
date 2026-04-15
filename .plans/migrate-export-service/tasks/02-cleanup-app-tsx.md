# T-002 Cleanup App.tsx

## Objective

Remove mixed backend code (Express server) and dead code (unused `ApiClient`) from `src/App.tsx`, leaving only the React component.

## Requirements Covered

- `NFR-002` - No dead code remains in `src/App.tsx`

## Dependencies

- None (can be done in parallel with T-001)

## Files or Areas Involved

- `src/App.tsx` - **Modify** - Remove Express server code and unused `ApiClient` class

## Actions

1. Read `src/App.tsx` to identify all code after the React component ends
2. Identify where the React `App` component ends (look for `export function App()` and its closing brace)
3. Remove all code after the React component that belongs to the old Express server:
   - Remove `import dotenv from "dotenv"; dotenv.config();`
   - Remove `import express from "express";`
   - Remove `import cors from "cors";`
   - Remove all route imports (`projectsRoutes`, `videosRoutes`, etc.)
   - Remove `const app = express();` and all middleware setup
   - Remove `app.listen()` call
   - Remove graceful shutdown code
   - Remove helper function `getRawBody`
4. Remove the unused `ApiClient` class and `apiClient` singleton (lines after the React component)
5. Remove any unused imports left over after cleanup
6. Ensure file ends with just the React component export
7. Run `pnpm typecheck` to verify no TypeScript errors

## Completion Criteria

- `src/App.tsx` contains only the React `App` component and its imports
- No Express server code remains
- No `ApiClient` class or `apiClient` singleton remains
- `pnpm typecheck` passes

## Validation

- Read `src/App.tsx` and verify:
  - Only React imports at top (react, components, hooks)
  - Only one export: `export function App()`
  - No `import express`, `import cors`, no `app.listen()`
  - No `ApiClient` class

## Risks or Notes

- The `src/services/api-client.ts` file may also be unused now - consider deleting it separately in T-003 if it's not imported anywhere
- The Vite config proxies `/api/*` requests to the Express backend, so the frontend doesn't need `ApiClient` - it uses direct `fetch` calls in hooks
