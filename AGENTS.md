# AGENTS.md - Instagram Post Builder

> **Inherits**: [AGENTS.md](../AGENTS.md)

## What's Different Here

Standalone HTML/CSS/JS tool for designing Instagram marketing posts for GymSpace. Not part of the monorepo packages—it's a design utility.

## Scope

- **Type**: Standalone web tool (single HTML + JS + CSS)
- **Purpose**: Build, preview, and export Instagram posts as PNG images
- **Platform**: Web browser (client-side only)

## Key Patterns (Specific to this scope)

### Architecture

- **Vanilla JS** - No framework, just ES6+ class-based architecture
- **PostBuilderApp class** - Main application controller in `js/app.js`
- **postsData object** - JSON-like data structure in `js/posts-data.js` defining all posts
- **html2canvas** - Used via CDN for PNG export functionality

### Post Types

- **Single Image** - Static posts with title, stats, features, CTA
- **Carousel** - Multi-slide posts with navigation (arrows + dots)

### Layout Types (Carousel slides)

- `numbered-list` - List with numbered items
- `two-col-comparison` - Before/after comparison cards
- `center-focus` - Large stat display in center
- `feature-focus` - Feature cards with icons
- `error-card` - Problem/solution error display

### Design System

- Custom fonts: **Sora** (display), **Manrope** (body)
- Brand colors: `gs-orange` (#F57E24), `gs-dark` (#2D3C53)
- Tailwind CSS via CDN for utility classes
- Custom CSS in `css/base.css` and `css/components.css`

### Export

- Single PNG export via html2canvas
- Batch export (all 16 posts) with progress overlay
- Output: `gymspace_post_XX.png`

## Key Files

| File                 | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `index.html`         | Main entry point, layout structure            |
| `js/app.js`          | PostBuilderApp class, rendering, export logic |
| `js/posts-data.js`   | Post definitions (16 posts with content)      |
| `js/exporter.js`     | PNG export utility using html2canvas          |
| `css/base.css`       | Design system variables, base styles          |
| `css/components.css` | UI components (sidebar, toolbar, gallery)     |

## References

- [Parent Context](../AGENTS.md) - General GymSpace conventions
- [docs/marketing/instagram-content-strategy.md](../../docs/marketing/instagram-content-strategy.md) - Content strategy reference

## Quick Notes

- No build step needed - open `index.html` directly in browser
- Data is hardcoded in `posts-data.js` - edit that file to modify content
- Export requires browser with html2canvas support
- All posts are 1080x1350px (Instagram portrait format)
