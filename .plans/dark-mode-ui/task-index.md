# Dark Mode UI - Task Index

## Summary

- **Mode**: Structured
- **Slug**: `dark-mode-ui`
- **Requirements File**: `requirements.md`
- **Checklist File**: `checklist.json`

## Requirements Coverage

| Requirement | Covered By |
| --- | --- |
| `FR-001` | `tasks/01-foundation-tailwind-vite-setup.md` |
| `FR-002` | `tasks/02-dark-design-tokens.md` |
| `FR-003` | `tasks/01-foundation-tailwind-vite-setup.md` |
| `FR-004` | `tasks/03-refactor-layout-components.md` |
| `FR-005` | `tasks/04-refactor-project-components.md` |
| `FR-006` | `tasks/05-refactor-video-components.md` |
| `FR-007` | `tasks/06-refactor-modal-components.md` |
| `FR-008` | `tasks/07-refactor-pipeline-components.md` |
| `FR-009` | `tasks/08-refactor-chat-components.md` |
| `FR-010` | `tasks/04-refactor-project-components.md` (status badges in ProjectCard, ProjectDetail) |
| `FR-011` | `tasks/02-dark-design-tokens.md` |
| `FR-012` | `tasks/02-dark-design-tokens.md` |
| `NFR-001` | All refactor tasks (orange contrast validation) |
| `NFR-002` | All refactor tasks (semantic tokens) |
| `NFR-003` | `tasks/01-foundation-tailwind-vite-setup.md` |

## Task List

| Task ID | File | Purpose | Dependencies |
| --- | --- | --- | --- |
| `T-001` | `tasks/01-foundation-tailwind-vite-setup.md` | Install Tailwind via npm, configure `@tailwindcss/vite` plugin, remove CDN script from `index.html` | none |
| `T-002` | `tasks/02-dark-design-tokens.md` | Define dark CSS variables in `src/index.css`, update scrollbar, body background, focus rings | `T-001` |
| `T-003` | `tasks/03-refactor-layout-components.md` | Apply dark Tailwind utilities to `Navbar` and `Tabs` | `T-002` |
| `T-004` | `tasks/04-refactor-project-components.md` | Apply dark Tailwind utilities to `ProjectsGrid`, `ProjectCard`, `ProjectDetail`, `ContextFiles`; redesign status badges | `T-002` |
| `T-005` | `tasks/05-refactor-video-components.md` | Apply dark Tailwind utilities to `VideoTable` and `VideoRow` | `T-002` |
| `T-006` | `tasks/06-refactor-modal-components.md` | Apply dark Tailwind utilities to `CreateProjectModal` and `CreateVideoModal` | `T-002` |
| `T-007` | `tasks/07-refactor-pipeline-components.md` | Apply dark Tailwind utilities to `PipelineView`, `StateMachine`, `SSEPanel` | `T-002` |
| `T-008` | `tasks/08-refactor-chat-components.md` | Apply dark Tailwind utilities to `AgentChat`, `MessageList`, `ChatInput`; normalize `slate-*` usage | `T-002` |

## Suggested Execution Order

1. `T-001` — **Foundation**: install Tailwind npm packages, configure Vite plugin, remove CDN; required before any other work
2. `T-002` — **Design tokens**: define CSS variables and global dark styles; base layer for all components
3. `T-003`, `T-004`, `T-005`, `T-006`, `T-007`, `T-008` — **Component refactors** (all depend only on `T-002`, so can run in parallel once `T-002` is done)

## Notes

- `T-003` through `T-008` are independent and can be executed in parallel after `T-002` completes
- The chat components (`AgentChat`, `MessageList`, `ChatInput`) use `slate-*` palette instead of `gray-*` — this task includes normalizing to consistent dark tokens
- Status badge redesign (part of `T-004`) affects `ProjectCard` and `VideoTable`/`VideoRow` via shared `statusConfig` objects
- `NFR-001` (orange contrast) should be validated manually when component colors are applied — no automated check unless a visual regression tool is added
