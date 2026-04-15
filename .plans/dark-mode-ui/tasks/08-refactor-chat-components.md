# T-008 Refactor Chat Components

## Objective

Apply dark Tailwind utilities to all chat components (`AgentChat`, `MessageList`, `ChatInput`). This task also normalizes the `slate-*` palette (used inconsistently in these components) to match the dark token system used in the rest of the app.

## Requirements Covered

- `FR-009` - Chat components use dark Tailwind utilities

## Dependencies

- `T-002` (design tokens must be in place)

## Files or Areas Involved

- `src/components/chat/AgentChat.tsx` - Modify
- `src/components/chat/MessageList.tsx` - Modify
- `src/components/chat/ChatInput.tsx` - Modify

## Actions

### `AgentChat.tsx` — Classes to replace (normalize `slate-*` to dark tokens)

| Current | Replace With |
| --- | --- |
| `bg-white` (container) | `bg-[var(--bg-card)]` |
| `border-slate-200` (header border) | `border-[var(--border-color)]` |
| `bg-slate-50` (header bg) | `bg-[var(--bg-input)]` |
| `text-slate-500` | `text-[var(--text-secondary)]` |
| `text-slate-700` | `text-[var(--text-primary)]` |
| `hover:text-slate-700` | `hover:text-[var(--text-primary)]` |
| `text-slate-400` | `text-[var(--text-muted)]` |
| `hover:bg-slate-200` (New session btn) | `hover:bg-[var(--bg-hover)]` |
| `hover:bg-slate-50` (stop btn) | `hover:bg-red-900/20` |
| `text-red-500` (stop btn) | `text-red-400` |
| `hover:text-red-700` | `hover:text-red-300` |
| `text-xs` | keep |
| `text-slate-600` | `text-[var(--text-secondary)]` |
| `bg-orange-100` | `bg-[var(--gs-orange)]/20` |
| `text-orange-600` | `text-[var(--gs-orange)]` |

### `MessageList.tsx` — Classes to replace (normalize `slate-*`)

| Current | Replace With |
| --- | --- |
| `bg-slate-100` (assistant bubble) | `bg-[var(--bg-input)]` |
| `text-slate-700` (assistant bubble text) | `text-[var(--text-secondary)]` |
| `text-slate-400` (typing indicator dots) | `text-[var(--text-muted)]` |
| `bg-blue-100` (user avatar) | `bg-blue-900/30` |
| `text-blue-600` (user icon) | `text-blue-400` |
| `bg-orange-100` (assistant avatar) | `bg-[var(--gs-orange)]/20` |
| `text-orange-600` (assistant icon) | `text-[var(--gs-orange)]` |
| `bg-blue-500` (user bubble) | `bg-blue-600` |
| `text-white` (user bubble text) | keep |

### `ChatInput.tsx` — Classes to replace (normalize `slate-*`)

| Current | Replace With |
| --- | --- |
| `bg-white` | `bg-[var(--bg-card)]` |
| `border-t border-slate-200` | `border-t border-[var(--border-color)]` |
| `p-4` | keep |
| `border border-slate-300` | `border border-[var(--border-color)]` |
| `focus:ring-orange-500` | keep |
| `focus:border-orange-500` | keep |
| `disabled:bg-slate-50` | `disabled:bg-[var(--bg-input)]` |
| `disabled:bg-slate-300` (button) | `disabled:bg-[var(--bg-input)]` |
| `text-slate-400` (placeholder) | `text-[var(--text-muted)]` |
| `text-slate-400` (helper text) | `text-[var(--text-muted)]` |
| `bg-orange-500` (send button) | `bg-[var(--gs-orange)]` |
| `hover:bg-orange-600` | `hover:bg-[var(--gs-orange-dark)]` |
| `bg-slate-300` (disabled send) | `bg-[var(--bg-input)]` |

## Completion Criteria

- `AgentChat`, `MessageList`, and `ChatInput` all render with dark backgrounds
- No `slate-*` utilities remain in these three files
- Chat message bubbles are visible and readable (user bubble blue, assistant bubble dark gray)
- Send button uses orange brand color

## Validation

- Open a project with the chat panel — confirm chat UI has dark background
- Send a message and verify the user/assistant bubbles are readable
