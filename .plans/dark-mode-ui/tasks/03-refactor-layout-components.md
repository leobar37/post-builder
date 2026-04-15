# T-003 Refactor Layout Components

## Objective

Apply dark Tailwind utilities to `Navbar` and `Tabs` components, replacing all light-mode gray palettes with the dark design system tokens.

## Requirements Covered

- `FR-004` - Layout components use dark Tailwind utilities

## Dependencies

- `T-002` (design tokens must be in place)

## Files or Areas Involved

- `src/components/layout/Navbar.tsx` - Modify - replace light grays with dark tokens
- `src/components/layout/Tabs.tsx` - Modify - replace light grays with dark tokens

## Actions

### `Navbar.tsx` — Current light-mode classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-500` / `hover:text-gray-700` | `text-[var(--text-secondary)]` / `hover:text-[var(--text-primary)]` |
| `bg-gray-200` (avatar) | `bg-[var(--bg-input)]` |
| `text-gray-600` | `text-[var(--text-muted)]` |
| `bg-orange-500` | `bg-[var(--gs-orange)]` |
| `text-orange-700` (badge) | `text-[var(--gs-orange)]` |
| `bg-orange-100` | `bg-[var(--gs-orange)]/20` (dark-friendly tint) |

### `Tabs.tsx` — Current light-mode classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `border-transparent` | `border-transparent` (keep) |
| `text-gray-500` | `text-[var(--text-muted)]` |
| `hover:text-gray-700` | `hover:text-[var(--text-secondary)]` |
| `border-orange-500` | `border-[var(--gs-orange)]` |
| `text-orange-500` | `text-[var(--gs-orange)]` |
| `text-gray-700` | `text-[var(--text-secondary)]` |

## Completion Criteria

- `Navbar` renders with dark card background, dark text, orange accents
- `Tabs` renders with dark tab bar, orange active indicator
- No light-mode gray utilities remain in either file

## Validation

- Start dev server, visually confirm Navbar and Tab bar have dark backgrounds
- Check that the orange "Video Pipeline" badge in Navbar is visible and readable
