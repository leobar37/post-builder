# T-001 Foundation: Tailwind Vite Setup

## Objective

Migrate Tailwind CSS from CDN-based (inline `<script>` in `index.html`) to npm-based using `@tailwindcss/vite`, properly integrated into the Vite React plugin pipeline.

## Requirements Covered

- `FR-001` - Tailwind npm + `@tailwindcss/vite` configuration
- `FR-003` - `tailwind.config.js` with dark UI color tokens
- `NFR-003` - `pnpm dev` and `pnpm build` succeed without errors

## Dependencies

- none

## Files or Areas Involved

- `package.json` - Modify - add `tailwindcss` and `@tailwindcss/vite` as dev dependencies
- `vite.config.ts` - Modify - add `tailwindcss()` to the plugins array
- `src/index.css` - Modify - replace `@tailwind base/components/utilities` directives (keep CSS variables)
- `index.html` - Modify - remove `<script src="https://cdn.tailwindcss.com">` and the inline `tailwind.config` block

## Actions

1. **Install Tailwind packages**
   ```bash
   pnpm add -D tailwindcss @tailwindcss/vite
   ```

2. **Update `vite.config.ts`** — add the Tailwind Vite plugin:
   ```ts
   import tailwindcss from '@tailwindcss/vite';
   // add to plugins: [..., tailwindcss()]
   ```

3. **Remove CDN from `index.html`** — delete the `<script src="https://cdn.tailwindcss.com"></script>` tag and the entire inline `<script>tailwind.config = {...}</script>` block

4. **Create `tailwind.config.js`** in the project root:
   - `content` array must include `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`
   - Extend `theme.colors` with the dark UI palette (see below)
   - Extend `theme.fontFamily` with Sora and Manrope
   - `darkMode` can be `'class'` (kept for future flexibility even though only dark mode is needed now)

   Dark UI color tokens to add:
   ```js
   colors: {
     // UI surfaces
     'ui-bg-primary': '#0f1117',
     'ui-bg-secondary': '#1a1d27',
     'ui-bg-card': '#252836',
     'ui-bg-input': '#1f2937',
     'ui-bg-hover': '#2a2d3a',
     'ui-border': '#2a2d3a',
     'ui-border-subtle': '#1f2937',
     // Text
     'ui-text-primary': '#f9fafb',
     'ui-text-secondary': '#9ca3af',
     'ui-text-muted': '#6b7280',
     // Brand orange preserved
     'gs-orange': '#F57E24',
     'gs-orange-light': '#FF9144',
     'gs-orange-dark': '#E56614',
     'gs-dark': '#2D3C53',
     'gs-dark-light': '#3D4C63',
     'gs-dark-darker': '#1D2C43',
   }
   ```

5. **Update `src/index.css`** — replace current content with:
   ```css
   @import "tailwindcss";

   :root {
     /* Brand */
     --gs-orange: #F57E24;
     --gs-orange-light: #FF9144;
     --gs-orange-dark: #E56614;
     --gs-dark: #2D3C53;
     --gs-dark-light: #3D4C63;
     --gs-dark-darker: #1D2C43;

     /* Dark UI surfaces */
     --bg-primary: #0f1117;
     --bg-secondary: #1a1d27;
     --bg-card: #252836;
     --bg-input: #1f2937;
     --bg-hover: #2a2d3a;
     --border-color: #2a2d3a;
     --border-subtle: #1f2937;
     --text-primary: #f9fafb;
     --text-secondary: #9ca3af;
     --text-muted: #6b7280;
   }

   html {
     background-color: var(--bg-primary);
   }

   body {
     font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
     background-color: var(--bg-primary);
     color: var(--text-primary);
   }

   .font-display {
     font-family: 'Sora', 'Manrope', sans-serif;
   }
   ```

6. **Verify the build works**:
   ```bash
   pnpm build
   ```

## Completion Criteria

- `package.json` contains `tailwindcss` and `@tailwindcss/vite` in `devDependencies`
- `vite.config.ts` has `tailwindcss()` in the plugins array
- `index.html` has no reference to `cdn.tailwindcss.com`
- `pnpm build` completes without errors

## Validation

- `pnpm build` exits with code 0
- Dev server (`pnpm dev:app`) starts without errors
- Inspect `dist/assets/*.css` after build to confirm Tailwind directives are processed
