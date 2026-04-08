# Instagram Reels Generation System

## Implementation Complete

This system generates Instagram Reels from GymSpace marketing posts with unique Remotion compositions for each video.

## Architecture

- **CLI Client** → **Express API** → **SQLite DB** + **Remotion Renderer**
- Web UI (read-only) for previewing completed reels

## Quick Start

### 1. Install Dependencies

```bash
cd marketing/instagram-post-builder
pnpm install
```

### 2. Start API Server

```bash
pnpm dev:api
# Server runs on http://localhost:3001
```

### 3. Create First Reel

```bash
pnpm cli create --post-id 1
```

### 4. Render Scenes

```bash
pnpm cli render <video-id>
```

### 5. Build Final Video

```bash
pnpm cli build <video-id>
```

## CLI Commands

- `reel create --post-id <n>` - Create reel from post
- `reel list` - List all reels
- `reel status <video-id>` - Check status
- `reel render <video-id>` - Render scenes
- `reel build <video-id>` - Build final video

## File Structure

```
videos/
└── {videoId}/
    ├── metadata.json
    ├── compositions/
    │   ├── Scene01.tsx      # Unique per video
    │   ├── Scene02.tsx
    │   └── index.ts
    ├── scenes/
    │   ├── scene-01.mp4
    │   └── scene-02.mp4
    └── output/
        └── reel-final.mp4
```

## System Components

| Component         | Purpose                           |
| ----------------- | --------------------------------- |
| `api/db/`         | SQLite database schema and client |
| `api/routes/`     | Express API endpoints             |
| `api/services/`   | Video generation and rendering    |
| `cli/`            | Command-line interface            |
| `src/generators/` | Scene composition generators      |

## Database Schema

- **videos**: id, post_id, title, status, total_scenes
- **scenes**: id, video_id, sequence, name, composition_path, status

## Next Steps for Testing

1. Start the API server: `pnpm dev:api`
2. Create a test reel: `pnpm cli create --post-id 1`
3. Render it: `pnpm cli render <video-id>`
4. Build final: `pnpm cli build <video-id>`

## Notes

- Each video generates unique React components based on post content
- Compositions are stored in `videos/{videoId}/compositions/`
- Rendered scenes are concatenated with FFmpeg
- Web UI is read-only; all creation happens via CLI
