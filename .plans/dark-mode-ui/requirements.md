# Dark Mode UI - Requirements

## Objective

Deliver a dark-mode-only frontend for the GymSpace Video Pipeline application, using Tailwind CSS via the `@tailwindcss/vite` Vite plugin, replacing all light-mode gray utilities with a cohesive dark UI palette.

## Scope

- **In scope**: Tailwind setup migration, dark design system tokens, component color refactoring, global dark styles
- **Out of scope**: Remotion video compositions, backend, API contracts, light/dark toggle

## Functional Requirements

- `FR-001` - Tailwind CSS is installed via npm and configured as a Vite plugin (`@tailwindcss/vite`), replacing the CDN script tag in `index.html`
- `FR-002` - Dark CSS variables are defined in `src/index.css` covering: backgrounds (`--bg-primary`, `--bg-card`, `--bg-input`, `--bg-hover`), borders (`--border-color`, `--border-subtle`), text (`--text-primary`, `--text-secondary`, `--text-muted`)
- `FR-003` - `tailwind.config.js` extends the theme with dark UI color tokens that reference the CSS variables
- `FR-004` - All layout components (`Navbar`, `Tabs`) use dark Tailwind utilities
- `FR-005` - All project components (`ProjectsGrid`, `ProjectCard`, `ProjectDetail`, `ContextFiles`) use dark Tailwind utilities
- `FR-006` - All video components (`VideoTable`, `VideoRow`) use dark Tailwind utilities
- `FR-007` - All modal components (`CreateProjectModal`, `CreateVideoModal`) use dark Tailwind utilities
- `FR-008` - All pipeline components (`PipelineView`, `StateMachine`, `SSEPanel`) use dark Tailwind utilities
- `FR-009` - All chat components (`AgentChat`, `MessageList`, `ChatInput`) use dark Tailwind utilities
- `FR-010` - Status badges have dark-mode-appropriate variants readable on dark backgrounds
- `FR-011` - Scrollbar uses dark background colors matching the theme
- `FR-012` - Body and global focus states use dark-compatible colors

## Non-Functional Requirements

- `NFR-001` - Brand orange (`#F57E24`) must maintain WCAG AA contrast ratio against dark backgrounds when used as text; use lighter variants for text, darker variants for filled states
- `NFR-002` - No hardcoded hex values in component files — use semantic Tailwind tokens
- `NFR-003` - `pnpm dev` and `pnpm build` must both succeed without errors after migration

## Acceptance Criteria

- `index.html` no longer contains `<script src="https://cdn.tailwindcss.com">`
- `package.json` includes `tailwindcss` and `@tailwindcss/vite` as dev dependencies
- `vite.config.ts` includes `tailwindcss()` in the plugins array
- `src/index.css` defines dark CSS variables and applies them to `body`
- All component files use only dark-mode Tailwind utilities (no `bg-white`, `bg-gray-50`, `text-gray-900`, etc.)
- App renders with dark background and visible orange accents when run locally
- `pnpm build` produces a valid production bundle

## Constraints

- The `html` tag in `index.html` does NOT get a `dark` class added (no toggle needed — always dark)
- Chat components currently use `slate-*` palette — must be normalized to the same dark tokens as the rest of the app
- No changes to component logic or behavior — only CSS class changes

## Open Questions

- Should the `gs-dark` brand palette (`#2D3C53`, `#3D4C63`, `#1D2C43`) be used for UI surfaces, or should a dedicated dark UI palette be chosen? (Current plan uses dedicated dark UI palette independent of brand colors)
- Does the orange accent need a dedicated dark-mode variant token (e.g., `--gs-orange-dark-bg` for filled badge backgrounds)?
