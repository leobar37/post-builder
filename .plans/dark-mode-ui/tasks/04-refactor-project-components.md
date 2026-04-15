# T-004 Refactor Project Components

## Objective

Apply dark Tailwind utilities to all project-related components and redesign status badges to be readable on dark backgrounds.

## Requirements Covered

- `FR-005` - Project components use dark Tailwind utilities
- `FR-010` - Status badges have dark-mode variants

## Dependencies

- `T-002` (design tokens must be in place)

## Files or Areas Involved

- `src/components/projects/ProjectsGrid.tsx` - Modify
- `src/components/projects/ProjectCard.tsx` - Modify
- `src/components/projects/ProjectDetail.tsx` - Modify
- `src/components/projects/ContextFiles.tsx` - Modify

## Actions

### `ProjectsGrid.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-gray-50` | `bg-[var(--bg-secondary)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `hover:border-orange-300` | `hover:border-[var(--gs-orange)]` |
| `hover:bg-orange-50` | `hover:bg-[var(--gs-orange)]/10` |
| `bg-gray-200` | `bg-[var(--bg-input)]` |
| `text-gray-400` | `text-[var(--text-muted)]` |
| `text-gray-500` | `text-[var(--text-secondary)]` |

### `ProjectCard.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `hover:shadow-md` | keep |
| `hover:border-orange-300` | `hover:border-[var(--gs-orange)]` |
| `bg-orange-100` | `bg-[var(--gs-orange)]/20` |
| `text-orange-600` | `text-[var(--gs-orange)]` |
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-500` / `text-gray-400` | `text-[var(--text-secondary)]` / `text-[var(--text-muted)]` |
| `border-gray-100` | `border-[var(--border-subtle)]` |
| `text-gray-600` (status) | depends on status color |

**Status badge color update** in `statusColors` record:
- `active: 'bg-green-100 text-green-700'` → `'bg-green-900/30 text-green-400'`
- `archived: 'bg-gray-100 text-gray-500'` → `'bg-[var(--bg-input)] text-[var(--text-muted)]'`
- `deleted: 'bg-red-100 text-red-700'` → `'bg-red-900/30 text-red-400'`

### `ProjectDetail.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `text-gray-900` / `text-gray-700` | `text-[var(--text-primary)]` / `text-[var(--text-secondary)]` |
| `text-gray-500` | `text-[var(--text-muted)]` |
| `text-gray-400` | `text-[var(--text-muted)]` |
| `border-gray-100` | `border-[var(--border-subtle)]` |
| `hover:text-gray-700` | `hover:text-[var(--text-secondary)]` |
| `hover:bg-gray-100` | `hover:bg-[var(--bg-hover)]` |
| `bg-orange-100` | `bg-[var(--gs-orange)]/20` |
| `text-orange-700` | `text-[var(--gs-orange)]` |
| `bg-orange-500` | `bg-[var(--gs-orange)]` |
| `hover:bg-orange-600` | `hover:bg-[var(--gs-orange-dark)]` |

### `ContextFiles.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-gray-50` | `bg-[var(--bg-input)]` |
| `text-gray-600` | `text-[var(--text-secondary)]` |
| `text-gray-400` | `text-[var(--text-muted)]` |
| `text-green-600` | `text-green-400` |

## Completion Criteria

- All four project components render with dark backgrounds and readable text
- Status badges on `ProjectCard` are visible and readable against dark backgrounds
- No light-mode gray utilities remain in these files

## Validation

- Open a project detail page — confirm cards, headers, and status badges are all dark-themed
- Verify the "Activo" badge is readable (not invisible on dark background)
