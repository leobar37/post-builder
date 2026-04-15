# Dark Mode UI - Context

## Overview

Convert the GymSpace Video Pipeline frontend from light-mode-only to dark-mode-only, using Tailwind CSS delivered via the official `@tailwindcss/vite` Vite plugin. The goal is a futuristic, cohesive dark aesthetic that keeps the brand's orange (`gs-orange`) as the primary accent color.

## Background

The application currently uses Tailwind via CDN (`cdn.tailwindcss.com`) with an inline config in `index.html`. All 16 React components use light-mode Tailwind utilities (`bg-gray-50`, `bg-white`, `text-gray-900`, `border-gray-200`, etc.). The brand colors (`gs-orange`, `gs-dark`) are defined but underused for UI surfaces.

## Goal

Replace all light-mode grays with a dark-mode palette across every UI surface. Tailwind transitions from CDN-based to npm-based with proper Vite integration. The resulting app looks futuristic and consistent, with dark backgrounds, light text, and vibrant orange accents.

## Key Decisions

- **Tailwind delivery**: Migrate from CDN to `@tailwindcss/vite` npm package
- **Dark mode strategy**: CSS variables + semantic Tailwind tokens — no `dark:` prefixes needed since only dark mode is supported
- **Color abstraction**: Define `--bg-card`, `--text-primary`, etc. as CSS variables; extend Tailwind to use them as custom color tokens
- **Brand orange preserved**: `#F57E24` remains the accent; may need lighter variant for text on dark backgrounds

## Scope Boundaries

### In scope
- Tailwind npm migration (CDN → `@tailwindcss/vite`)
- Dark CSS variable design system in `src/index.css`
- `tailwind.config.js` with dark UI color tokens
- Component color refactoring (all `.tsx` files under `src/components/`)
- Global styles: scrollbar, body background, focus rings
- Status badge dark variants

### Out of scope
- Remotion video compositions (they are self-contained dark compositions)
- Backend (no changes)
- API contracts or data model changes
- New component creation
- Light mode toggle (dark-only, no toggle)
