# T-006 Refactor Modal Components

## Objective

Apply dark Tailwind utilities to modal components (`CreateProjectModal` and `CreateVideoModal`) including form inputs, overlay, and call-to-action buttons.

## Requirements Covered

- `FR-007` - Modal components use dark Tailwind utilities

## Dependencies

- `T-002` (design tokens must be in place)

## Files or Areas Involved

- `src/components/modals/CreateProjectModal.tsx` - Modify
- `src/components/modals/CreateVideoModal.tsx` - Modify

## Actions

### `CreateProjectModal.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` (modal container) | `bg-[var(--bg-card)]` |
| `shadow-2xl` | keep |
| `border-gray-200` (modal border) | `border-[var(--border-color)]` |
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-400` | `text-[var(--text-muted)]` |
| `text-gray-500` | `text-[var(--text-secondary)]` |
| `text-gray-600` | `text-[var(--text-secondary)]` |
| `text-gray-700` | `text-[var(--text-secondary)]` |
| `hover:text-gray-600` | `hover:text-[var(--text-secondary)]` |
| `border-gray-300` (inputs) | `border-[var(--border-color)]` |
| `focus:ring-orange-500` | keep (orange on dark input works) |
| `focus:border-orange-500` | keep |
| `bg-gray-50` (info box) | `bg-[var(--bg-input)]` |
| `text-gray-400` (info text) | `text-[var(--text-muted)]` |
| `text-gray-600` (info text) | `text-[var(--text-secondary)]` |
| `bg-gray-100` (code bg) | `bg-[var(--bg-input)]` |
| `text-red-50` (error bg) | `bg-red-900/30` |
| `text-red-700` (error text) | `text-red-400` |
| `border-gray-300` (cancel button) | `border-[var(--border-color)]` |
| `text-gray-700` (cancel button) | `text-[var(--text-secondary)]` |
| `hover:bg-gray-50` (cancel button) | `hover:bg-[var(--bg-hover)]` |
| `bg-orange-500` (submit button) | `bg-[var(--gs-orange)]` |
| `hover:bg-orange-600` (submit button) | `hover:bg-[var(--gs-orange-dark)]` |
| `text-gray-300` (checkmark) | `text-[var(--text-muted)]` |
| `text-green-500` (checkmark) | `text-green-400` |

### `CreateVideoModal.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` (modal container) | `bg-[var(--bg-card)]` |
| `shadow-2xl` | keep |
| `border-gray-200` | `border-[var(--border-color)]` |
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-400` | `text-[var(--text-muted)]` |
| `text-gray-500` | `text-[var(--text-secondary)]` |
| `text-gray-600` | `text-[var(--text-secondary)]` |
| `text-gray-700` | `text-[var(--text-secondary)]` |
| `hover:text-gray-600` | `hover:text-[var(--text-secondary)]` |
| `border-gray-300` (inputs) | `border-[var(--border-color)]` |
| `focus:ring-orange-500` | keep |
| `focus:border-orange-500` | keep |
| `bg-orange-50` (info box) | `bg-[var(--gs-orange)]/10` |
| `text-orange-700` (info text) | `text-[var(--gs-orange)]` |
| `border-gray-300` (cancel) | `border-[var(--border-color)]` |
| `text-gray-700` (cancel) | `text-[var(--text-secondary)]` |
| `hover:bg-gray-50` (cancel) | `hover:bg-[var(--bg-hover)]` |
| `bg-orange-500` (submit) | `bg-[var(--gs-orange)]` |
| `hover:bg-orange-600` (submit) | `hover:bg-[var(--gs-orange-dark)]` |

## Completion Criteria

- Both modals render with dark card backgrounds
- Form inputs have dark backgrounds (`bg-[var(--bg-input)]`) with visible borders
- CTA buttons use orange brand color
- Modal overlay (`bg-black/40`) keeps the dark semi-transparent overlay
- No light-mode gray utilities remain in these files

## Validation

- Click "Nuevo Proyecto" and "Nuevo Video" buttons — verify modals open with dark backgrounds
- Confirm input fields have dark backgrounds and visible focus rings
