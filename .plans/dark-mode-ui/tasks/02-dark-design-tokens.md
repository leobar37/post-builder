# T-002 Dark Design Tokens and Global Styles

## Objective

Establish the dark CSS variable foundation in `src/index.css` covering backgrounds, borders, text, scrollbar, and focus states. These tokens are the single source of truth for all dark-mode colors in the application.

## Requirements Covered

- `FR-002` - Dark CSS variables in `src/index.css`
- `FR-011` - Scrollbar dark styling
- `FR-012` - Body background and focus ring dark compatibility

## Dependencies

- `T-001` (foundation must be complete first — depends on Tailwind npm setup being in place)

## Files or Areas Involved

- `src/index.css` - Modify - add all dark CSS tokens, scrollbar, transitions, global focus ring

## Actions

1. **Ensure `src/index.css` contains the full dark token set** (should already be added in `T-001` foundation step; verify completeness):
   - Backgrounds: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--bg-input`, `--bg-hover`
   - Borders: `--border-color`, `--border-subtle`
   - Text: `--text-primary`, `--text-secondary`, `--text-muted`
   - Brand: `--gs-orange`, `--gs-orange-light`, `--gs-orange-dark`, `--gs-dark`, `--gs-dark-light`, `--gs-dark-darker`

2. **Add scrollbar styling** replacing the existing light-mode scrollbar:
   ```css
   ::-webkit-scrollbar {
     width: 8px;
     height: 8px;
   }
   ::-webkit-scrollbar-track {
     background: var(--bg-secondary);
     border-radius: 4px;
   }
   ::-webkit-scrollbar-thumb {
     background: var(--border-color);
     border-radius: 4px;
   }
   ::-webkit-scrollbar-thumb:hover {
     background: var(--text-muted);
   }
   ```

3. **Add global focus ring override** for dark-compatible orange focus:
   ```css
   *:focus-visible {
     outline: 2px solid var(--gs-orange);
     outline-offset: 2px;
   }
   ```

4. **Add global transition** (replace existing transition rule):
   ```css
   * {
     transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow;
     transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
     transition-duration: 150ms;
   }
   ```
   Note: Remove `transform` from transitions to avoid layout jank on hover.

5. **Verify the CSS processes correctly** by running `pnpm build` — the CSS should include all Tailwind utilities compiled from the `@import "tailwindcss"` directive.

## Completion Criteria

- `src/index.css` contains all dark CSS variables listed in the actions
- Scrollbar renders with dark background in browser
- Focus rings appear as orange outline on interactive elements
- `pnpm build` produces CSS without errors

## Validation

- Open the app in browser, inspect `body` element — background should be `#0f1117`
- Scroll any overflow container and verify scrollbar thumb is dark
- Tab through interactive elements and verify orange focus ring appears
