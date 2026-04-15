# T-001 Fix Export Routes CSS

## Objective

Fix `api/routes/export.routes.ts` so it no longer reads `src/base.css` and `src/components.css` which were deleted during the migration from vanilla JS to React.

## Requirements Covered

- `FR-001` - API server starts without errors
- `FR-002` - Health endpoint returns 200 OK
- `FR-005` - Export routes respond correctly

## Dependencies

- None (foundation task)

## Files or Areas Involved

- `api/routes/export.routes.ts` - **Modify** - Remove CSS file reads and `inlineCss` function
- `api/index.ts` - **Review** - Verify import of export routes is correct

## Actions

1. Read `api/routes/export.routes.ts` to understand the current `inlineCss` logic
2. Remove the `readFileSync` calls for `src/base.css` and `src/components.css` (lines 12-13)
3. Remove the `inlineCss` helper function if it's only used for CSS inlining
4. If the export endpoint is needed for future use:
   - Remove CSS inlining entirely (Tailwind CSS is bundled by Vite, not served separately)
   - Keep the endpoint but strip out the CSS handling
5. If the export endpoint is not needed:
   - Consider removing the entire route or commenting it out
6. Verify imports are cleaned up (remove unused `readFileSync`, `join` from `fs`/`path` if no longer needed)
7. Run `pnpm typecheck` to verify no TypeScript errors

## Completion Criteria

- `api/routes/export.routes.ts` no longer reads `src/base.css` or `src/components.css`
- `pnpm run dev:api` starts without `ENOENT` error
- `curl http://localhost:3458/health` returns `200 OK`

## Validation

- Start API with `pnpm run dev:api`
- In another terminal, run `curl http://localhost:3458/health`
- Run `pnpm typecheck` and verify no errors

## Risks or Notes

- The export routes may have other dependencies (Browserless service) that are not configured
- If Browserless is not configured, export requests will fail, but that's expected and separate from the CSS issue
- The `inlineCss` function was replacing `<link>` tags with inline `<style>` tags - this is no longer needed with Vite's bundled CSS
