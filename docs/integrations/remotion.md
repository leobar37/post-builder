# Remotion Integration

## Overview

Remotion is used for video composition, editing, and preview.

**Website**: https://www.remotion.dev/
**Docs**: https://www.remotion.dev/docs/

## Architecture

```
┌──────────────┐      HTTP       ┌─────────────────┐
│   React UI   │◄───────────────►│  Remotion       │
│              │   /preview      │  Player/Renderer│
└──────────────┘                 └─────────────────┘
                                        │
                                        │ Render
                                        ▼
                                   ┌──────────┐
                                   │ MP4/PNG  │
                                   │ Output   │
                                   └──────────┘
```

## Components

### 1. Player (Preview)

The Remotion Player is embedded in the React frontend for real-time preview.

```typescript
import { Player } from '@remotion/player';
import { VideoComposition } from './compositions/VideoComposition';

export function VideoPreview({ videoId }: { videoId: string }) {
  return (
    <Player
      component={VideoComposition}
      durationInFrames={300} // 10s at 30fps
      fps={30}
      compositionWidth={1080}
      compositionHeight={1920} // 9:16 for Reels
      inputProps={{ videoId }}
      controls
    />
  );
}
```

### 2. Composition

```typescript
// compositions/VideoComposition.tsx
import { useVideoConfig, Video, staticFile } from 'remotion';
import { useEffect, useState } from 'react';

export function VideoComposition({ videoId }: { videoId: string }) {
  const { fps, durationInFrames } = useVideoConfig();
  const [scenes, setScenes] = useState([]);

  useEffect(() => {
    // Fetch video data from API
    fetch(`/api/videos/${videoId}`)
      .then(r => r.json())
      .then(setScenes);
  }, [videoId]);

  return (
    <div>
      {scenes.map((scene, i) => (
        <Video
          key={i}
          src={staticFile(scene.videoUrl)}
          startFrom={scene.startFrame}
          endAt={scene.endFrame}
        />
      ))}
    </div>
  );
}
```

### 3. Renderer (API)

```typescript
import { renderMedia, selectComposition } from '@remotion/renderer';

export async function renderVideo(videoId: string) {
  const composition = await selectComposition({
    serveUrl: 'http://localhost:3001', // Remotion bundle URL
    id: 'VideoComposition',
    inputProps: { videoId },
  });

  await renderMedia({
    composition,
    serveUrl: 'http://localhost:3001',
    codec: 'h264',
    outputLocation: `./videos/output/${videoId}.mp4`,
  });
}
```

## Configuration

### remotion.config.ts

```typescript
import { Config } from 'remotion';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');

// Instagram Reels format
export const REELS_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInSeconds: 30, // Max for Reels
};
```

## Project Structure

```
remotion/
├── compositions/
│   ├── VideoComposition.tsx    # Main video composition
│   ├── Scene.tsx               # Individual scene component
│   └── Transitions.tsx         # Transition effects
├── components/
│   ├── TextOverlay.tsx         # Text overlays
│   ├── Logo.tsx                # Brand logo
│   └── Audio.tsx               # Background music
├── utils/
│   ├── frames.ts               # Frame calculations
│   └── colors.ts               # Brand colors
└── config.ts                   # Configuration
```

## Integration with Video Pipeline

### 1. Scene Mapping

```typescript
// Map MiniMax clips to Remotion scenes
interface Scene {
  id: string;
  videoUrl: string;
  startFrame: number;
  endFrame: number;
  textOverlay?: {
    text: string;
    startFrame: number;
    endFrame: number;
  };
}

function clipsToScenes(clips: MiniMaxClip[]): Scene[] {
  let currentFrame = 0;
  return clips.map(clip => {
    const frames = clip.duration * 30; // 30fps
    const scene = {
      id: clip.id,
      videoUrl: clip.localPath,
      startFrame: currentFrame,
      endFrame: currentFrame + frames,
    };
    currentFrame += frames;
    return scene;
  });
}
```

### 2. Preview Flow

```
1. User clicks "Preview" in Web UI
   ↓
2. API fetches video scenes from SQLite
   ↓
3. API returns scene data to frontend
   ↓
4. Remotion Player renders with real clips
   ↓
5. User sees preview with transitions
```

### 3. Render Flow

```
1. User clicks "Export" in Web UI
   ↓
2. POST /api/videos/:id/render
   ↓
3. API calls Remotion renderMedia()
   ↓
4. Progress updates via polling
   ↓
5. Download link ready
```

## Styling for Instagram Reels

### Safe Zones

```typescript
// Safe zone constants for Reels
const SAFE_ZONES = {
  // Text should be within this area
  text: {
    top: 150,
    bottom: 400,
    left: 100,
    right: 980,
  },
  // Logo area
  logo: {
    x: 540,
    y: 1800,
  },
};
```

### Typography

```typescript
const REELS_TYPOGRAPHY = {
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeWidth: 4,
  },
  subtitle: {
    fontSize: 48,
    color: '#ffffff',
  },
  caption: {
    fontSize: 36,
    color: '#ffffff',
  },
};
```
