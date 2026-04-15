# Migrate Export Service - Overview Context

## Overview

The Instagram Post Builder app is undergoing a migration from a vanilla JS/HTML tool to a React/Vite frontend with a separate Express API backend. This migration left several broken references: the API server fails to start because export routes reference CSS files that no longer exist, and the frontend `App.tsx` file contains mixed frontend/backend code.

## Background

- The original app was a standalone HTML/JS tool (`src/app.ts`, `src/base.css`, `src/components.css`) that bundled everything including an Express server in the same repo
- The migration replaced it with React (`src/App.tsx`, `src/main.tsx`) + Vite for frontend, and Express (`api/index.ts`) for the API
- CSS files were removed because Tailwind CSS is now bundled by Vite instead of being separate CSS files
- The Express API in `api/index.ts` imports `export.routes.ts` which still tries to read the deleted CSS files

## Goal

Restore full app functionality by:
1. Fixing the API server so it starts without errors
2. Removing dead/mixed code from `src/App.tsx`
3. Verifying CRUD operations for projects and videos work end-to-end

## Decomposition Rationale

- This initiative was split into tasks because the fixes are independent but ordered:
  - Export routes fix must come first (unblocks API startup)
  - App.tsx cleanup is independent but logically follows understanding of what the old system did
  - Full stack verification confirms everything works together

## Scope Boundaries

- **In scope**: API startup fix, export routes CSS handling, App.tsx cleanup, CRUD verification
- **Out of scope**: New features, database schema changes, new API endpoints, Remotion video rendering

## Evidence Buckets

### Verified
- `pnpm run build` succeeds (frontend compiles correctly)
- `tsc --noEmit` passes (no TypeScript errors)
- API fails to start with `ENOENT: no such file or directory, open 'src/base.css'`
- `api/routes/export.routes.ts` reads `src/base.css` and `src/components.css` at module load time (lines 12-13)
- `src/App.tsx` contains both React component AND Express server code (lines ~200+)
- `src/App.tsx` contains unused `ApiClient` class and `apiClient` singleton
- Deleted files confirmed via `git status`: `src/app.ts`, `src/base.css`, `src/components.css`, `src/posts-data.ts`, `src/services/export.service.ts`

### Inferred
- The old export service used html2canvas in-browser for PNG generation; the new export route uses Browserless for server-side rendering
- The CSS inlining was needed because the vanilla JS app served HTML/CSS separately from the Express server
- With React + Vite, CSS is bundled at build time, so CSS inlining at request time is no longer necessary or valid

### Unknown
- Whether the Browserless service is configured/running (only saw warning about `MINIMAX_API_KEY`)
- Whether the export endpoint actually works end-to-end after CSS fix
