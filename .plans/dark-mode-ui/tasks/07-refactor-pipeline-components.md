# T-007 Refactor Pipeline Components

## Objective

Apply dark Tailwind utilities to pipeline components (`PipelineView`, `StateMachine`, `SSEPanel`). Note that `SSEPanel` already has a dark terminal area — the goal is to unify the outer shell with the rest of the dark UI.

## Requirements Covered

- `FR-008` - Pipeline components use dark Tailwind utilities

## Dependencies

- `T-002` (design tokens must be in place)

## Files or Areas Involved

- `src/components/pipeline/PipelineView.tsx` - Modify
- `src/components/pipeline/StateMachine.tsx` - Modify
- `src/components/pipeline/SSEPanel.tsx` - Modify

## Actions

### `PipelineView.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-500` | `text-[var(--text-secondary)]` |

### `StateMachine.tsx` — Classes to replace

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-500` | `text-[var(--text-muted)]` |
| `bg-gray-100` (inactive step circles) | `bg-[var(--bg-input)]` |
| `border-gray-300` | `border-[var(--border-color)]` |
| `bg-orange-50` (spinning step) | `bg-[var(--gs-orange)]/20` |
| `border-orange-200` | `border-[var(--gs-orange)]/50` |
| `text-orange-500` | `text-[var(--gs-orange)]` |
| `bg-green-50` (completed step) | `bg-green-900/20` |
| `border-green-200` | `border-green-900/50` |
| `text-green-600` | `text-green-400` |
| `bg-blue-50` | `bg-blue-900/20` |
| `text-blue-500` | `text-blue-400` |
| `bg-indigo-100` | `bg-indigo-900/30` |
| `text-indigo-700` | `text-indigo-400` |
| `border-gray-100` | `border-[var(--border-subtle)]` |
| `text-gray-600` | `text-[var(--text-secondary)]` |
| `text-gray-400` | `text-[var(--text-muted)]` |
| `bg-gray-100` (path alternative) | `bg-[var(--bg-input)]` |
| `text-gray-600` (path alternative) | `text-[var(--text-secondary)]` |
| `bg-red-100` (failed path) | `bg-red-900/30` |
| `text-red-700` (failed path) | `text-red-400` |

### `SSEPanel.tsx` — Classes to replace (outer shell; dark terminal stays as-is)

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-500` | `text-[var(--text-secondary)]` |
| `bg-gray-400` (disconnected dot) | `bg-[var(--text-muted)]` |
| `bg-green-500` (connected dot) | `bg-green-400` |
| `text-green-600` (connected label) | `text-green-400` |
| `text-gray-500` (disconnected label) | `text-[var(--text-muted)]` |

**Keep unchanged**: The `bg-gray-900` terminal area, `text-green-400` event text, and monospace font in the SSE event log. These are already dark and are a design feature of this component.

## Completion Criteria

- `StateMachine` step circles use dark backgrounds with colored borders matching their state
- `SSEPanel` outer shell matches the dark card style while the terminal area remains dark-on-dark
- All three components have no light-mode gray utilities remaining

## Validation

- Navigate to the Pipeline tab — confirm the state machine steps have dark backgrounds
- Confirm the SSE event log terminal is still dark with green text
