# T-005 Refactor Video Components

## Objective

Apply dark Tailwind utilities to video-related components (`VideoTable` and `VideoRow`) including status badges and progress indicators.

## Requirements Covered

- `FR-006` - Video components use dark Tailwind utilities

## Dependencies

- `T-002` (design tokens must be in place)

## Files or Areas Involved

- `src/components/videos/VideoTable.tsx` - Modify
- `src/components/videos/VideoRow.tsx` - Modify

## Actions

### `VideoTable.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-500` | `text-[var(--text-secondary)]` |
| `text-gray-400` | `text-[var(--text-muted)]` |
| `hover:bg-gray-50` | `hover:bg-[var(--bg-hover)]` |
| `bg-gray-50` (table header) | `bg-[var(--bg-input)]` |
| `bg-gray-100` (hover) | `bg-[var(--bg-hover)]` |
| `border-gray-200` (table header) | `border-[var(--border-color)]` |
| `border-gray-100` (table body) | `border-[var(--border-subtle)]` |
| `border-gray-200` (table header) | `border-[var(--border-color)]` |
| `text-gray-500` (table header) | `text-[var(--text-secondary)]` |
| `text-gray-400` (no results) | `text-[var(--text-muted)]` |
| `bg-orange-100` (filter active) | `bg-[var(--gs-orange)]/20` |
| `text-orange-700` (filter active) | `text-[var(--gs-orange)]` |
| `hover:bg-gray-100` (filter inactive) | `hover:bg-[var(--bg-hover)]` |
| `border-0` (search input) | keep |
| `bg-transparent` (search input) | keep |
| `bg-gray-200` (progress bar track) | `bg-[var(--bg-input)]` |

**Filter buttons** (`filter.key === activeFilter`):
- `bg-orange-100 text-orange-700` → `bg-[var(--gs-orange)]/20 text-[var(--gs-orange)]`
- inactive: `text-gray-500 hover:bg-gray-100` → `text-[var(--text-muted)] hover:bg-[var(--bg-hover)]`

### `VideoRow.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `hover:shadow-sm` | keep |
| `bg-gray-900` (thumbnail placeholder — keep) | keep (already dark) |
| `text-white` (thumbnail icon — keep) | keep |
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-500` | `text-[var(--text-secondary)]` |
| `text-gray-400` | `text-[var(--text-muted)]` |
| `bg-gray-100` | `bg-[var(--bg-input)]` |
| `bg-gray-200` (progress track) | `bg-[var(--bg-input)]` |
| `hover:bg-gray-100` (action buttons) | `hover:bg-[var(--bg-hover)]` |
| `text-gray-600` (action icons) | `text-[var(--text-muted)]` |
| `text-orange-500` (retry button) | `text-[var(--gs-orange)]` |

**Status badge colors** in `statusConfig` — dark variants:
- `draft: { label: 'Borrador', class: 'bg-gray-100 text-gray-500' }` → `'bg-[var(--bg-input)] text-[var(--text-muted)]'`
- `generating_idea: { label: 'Generando idea', class: 'bg-orange-100 text-orange-700' }` → `'bg-[var(--gs-orange)]/20 text-[var(--gs-orange)]'`
- `idea_ready: { label: 'Idea lista', class: 'bg-blue-100 text-blue-700' }` → `'bg-blue-900/30 text-blue-400'`
- `generating_clips: { label: 'Generando clips', class: 'bg-orange-100 text-orange-700' }` → `'bg-[var(--gs-orange)]/20 text-[var(--gs-orange)]'`
- `clips_ready: { label: 'Clips listos', class: 'bg-indigo-100 text-indigo-700' }` → `'bg-indigo-900/30 text-indigo-400'`
- `composing: { label: 'Componiendo', class: 'bg-orange-100 text-orange-700' }` → `'bg-[var(--gs-orange)]/20 text-[var(--gs-orange)]'`
- `completed: { label: 'Completado', class: 'bg-green-100 text-green-700' }` → `'bg-green-900/30 text-green-400'`
- `failed: { label: 'Fallido', class: 'bg-red-100 text-red-700' }` → `'bg-red-900/30 text-red-400'`

## Completion Criteria

- `VideoTable` renders with dark header, dark filter buttons, dark table
- `VideoRow` renders with dark card, dark status badges with colored backgrounds visible against dark card
- Progress bars use dark track color
- No light-mode gray utilities remain in these files

## Validation

- Navigate to the Videos tab — confirm table has dark background, white text, colored status badges
- Confirm the progress bar tracks are dark (not light gray)
