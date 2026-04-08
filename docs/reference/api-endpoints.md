# API Endpoints Reference

## Video Pipeline API

### Projects

#### List Projects
```http
GET /api/projects
```

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Promoción Mayo 2024",
      "description": "Campaña de promoción de mayo",
      "contextPath": "./content/promo-mayo",
      "status": "active",
      "videoCount": 5,
      "completedVideos": 3,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 10
}
```

#### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "name": "Promoción Mayo 2024",
  "description": "Campaña de promoción de mayo",
  "contextPath": "./content/promo-mayo",
  "config": {
    "defaultDuration": 6,
    "defaultResolution": "1080p",
    "defaultAspectRatio": "9:16"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Promoción Mayo 2024",
  "description": "Campaña de promoción de mayo",
  "contextPath": "./content/promo-mayo",
  "config": {
    "defaultDuration": 6,
    "defaultResolution": "1080p"
  },
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Get Project
```http
GET /api/projects/:id
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Promoción Mayo 2024",
  "description": "Campaña de promoción de mayo",
  "contextPath": "./content/promo-mayo",
  "config": {
    "defaultDuration": 6,
    "defaultResolution": "1080p"
  },
  "status": "active",
  "videos": [
    {
      "id": "video-uuid",
      "status": "completed",
      "prompt": "Video promocional...",
      "progress": 100,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Update Project
```http
PATCH /api/projects/:id
Content-Type: application/json

{
  "name": "Nuevo nombre",
  "contextPath": "./content/nuevo-path",
  "status": "archived"
}
```

#### Delete Project
```http
DELETE /api/projects/:id
```

### Videos

#### Create Video
```http
POST /api/projects/:projectId/videos
Content-Type: application/json

{
  "prompt": "Video promocional de membresías"
}
```

**Response:**
```json
{
  "id": "uuid",
  "projectId": "project-uuid",
  "status": "draft",
  "prompt": "Video promocional...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### List Videos (by project)
```http
GET /api/projects/:projectId/videos
```

**Response:**
```json
{
  "videos": [
    {
      "id": "uuid",
      "status": "completed",
      "prompt": "Video promocional...",
      "progress": 100,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5
}
```

#### Get Video
```http
GET /api/videos/:id
```

**Response:**
```json
{
  "id": "uuid",
  "projectId": "project-uuid",
  "status": "generating_clips",
  "prompt": "...",
  "idea": {
    "title": "...",
    "description": "...",
    "scenes": [...]
  },
  "scenes": [
    {
      "id": "scene-1",
      "status": "completed",
      "videoUrl": "/videos/clip1.mp4"
    }
  ],
  "progress": 45,
  "project": {
    "id": "project-uuid",
    "name": "Promoción Mayo 2024",
    "contextPath": "./content/promo-mayo"
  }
}
```

#### Delete Video
```http
DELETE /api/videos/:id
```

### OpenCode Commands

#### Send Command
```http
POST /command
Content-Type: application/json

{
  "prompt": "Generate video idea",
  "projectId": "project-uuid",
  "sessionId": "optional-existing-session"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "status": "started",
  "message": "Command sent to OpenCode. Listen to SSE for events."
}
```

#### Close Session
```http
DELETE /command/:sessionId
```

### SSE Events

#### Subscribe to Events
```http
GET /events/:sessionId
Accept: text/event-stream
```

**Event Format:**
```
data: {"type": "text", "sessionId": "...", "data": {...}, "timestamp": "..."}

data: {"type": "tool_call", "sessionId": "...", "data": {...}, "timestamp": "..."}

data: {"type": "done", "sessionId": "...", "data": {...}, "timestamp": "..."}
```

### MiniMax Webhooks (Internal)

#### Submit Video Idea
```http
POST /api/videos/:id/idea
Content-Type: application/json

{
  "title": "Promo Verano 2024",
  "description": "...",
  "scenes": [
    {
      "id": "scene-1",
      "description": "...",
      "duration": 6,
      "prompt": "..."
    }
  ]
}
```

#### Approve Idea & Start Generation
```http
POST /api/videos/:id/approve
```

#### Regenerate Scene
```http
POST /api/videos/:id/scenes/:sceneId/regenerate
```

#### Start Render
```http
POST /api/videos/:id/render
```

### MiniMax Advanced Control

#### Generate Scene
```http
POST /api/scenes/:sceneId/generate
Content-Type: application/json

{
  "prompt": "Atleta haciendo sentadillas en gimnasio moderno",
  "params": {
    "model": "T2V-01-Director",
    "cameraControl": {
      "type": "zoom_in",
      "speed": "slow"
    },
    "visualStyle": {
      "cinematic": true,
      "lighting": "studio"
    },
    "quality": "high"
  },
  "priority": "high"
}
```

**Response:**
```json
{
  "sceneId": "scene-uuid",
  "taskId": "minimax-task-123",
  "status": "queued",
  "estimatedTime": 120,
  "queuePosition": 2
}
```

#### Cancel Generation
```http
POST /api/scenes/:sceneId/cancel
```

**Response:**
```json
{
  "sceneId": "scene-uuid",
  "taskId": "minimax-task-123",
  "status": "cancelled",
  "refunded": false
}
```

#### Regenerate Scene
```http
POST /api/scenes/:sceneId/regenerate
Content-Type: application/json

{
  "useSamePrompt": false,
  "newPrompt": "Atleta haciendo sentadillas, ángulo más amplio",
  "params": {
    "quality": "ultra",
    "seed": 12345
  },
  "reason": "quality"
}
```

#### Get Scene Status
```http
GET /api/scenes/:sceneId/status
```

**Response:**
```json
{
  "sceneId": "scene-uuid",
  "status": "processing",
  "progress": {
    "percentage": 65,
    "stage": "generation",
    "estimatedTimeRemaining": 45
  },
  "metadata": {
    "taskId": "minimax-task-123",
    "queuedAt": "2024-01-15T10:30:00Z",
    "startedAt": "2024-01-15T10:30:05Z",
    "params": {},
    "attempts": [
      {
        "attemptNumber": 1,
        "status": "processing",
        "timestamp": "2024-01-15T10:30:05Z"
      }
    ]
  }
}
```

#### Generate All Scenes
```http
POST /api/videos/:videoId/generate-all
Content-Type: application/json

{
  "baseParams": {
    "resolution": "1080p",
    "quality": "high",
    "visualStyle": {
      "cinematic": true,
      "colorGrade": "vibrant"
    }
  },
  "sceneParams": {
    "scene-1": {
      "cameraControl": { "type": "zoom_in", "speed": "slow" }
    }
  },
  "strategy": "staggered",
  "maxParallel": 3
}
```

#### Pause/Resume Generations
```http
POST /api/videos/:videoId/pause
```

**Response:**
```json
{
  "videoId": "video-uuid",
  "pausedScenes": ["scene-1", "scene-2"],
  "canResume": true
}
```

```http
POST /api/videos/:videoId/resume
```

### SSE Events for MiniMax

```http
GET /api/scenes/:sceneId/events
Accept: text/event-stream
```

**Event Types:**
```
data: {"type": "queued", "sceneId": "s1", "data": {"position": 3}}
data: {"type": "started", "sceneId": "s1", "data": {"stage": "initialization"}}
data: {"type": "progress", "sceneId": "s1", "data": {"percentage": 25}}
data: {"type": "stage_change", "sceneId": "s1", "data": {"stage": "encoding"}}
data: {"type": "completed", "sceneId": "s1", "data": {"downloadUrl": "..."}}
data: {"type": "cancelled", "sceneId": "s1"}
data: {"type": "failed", "sceneId": "s1", "data": {"error": "..."}}
```

### Preview

#### Get Remotion Preview URL
```http
GET /api/videos/:id/preview
```

**Response:**
```json
{
  "playerUrl": "http://localhost:3001/preview?videoId=uuid",
  "renderUrl": "http://localhost:3001/render?videoId=uuid"
}
```

## Status Values

### Video Status

| Status | Description |
|--------|-------------|
| `draft` | Initial state |
| `generating_idea` | OpenCode generating idea |
| `idea_ready` | Idea ready, waiting for approval |
| `generating_clips` | MiniMax generating clips |
| `clips_ready` | All clips ready |
| `composing` | Remotion composing final video |
| `completed` | Video ready |
| `failed` | Error occurred |

### Project Status

| Status | Description |
|--------|-------------|
| `active` | Project is active |
| `archived` | Project archived (read-only) |
| `deleted` | Soft deleted |

### MiniMax Status

| Status | Description |
|--------|-------------|
| `pending` | Waiting to start |
| `queued` | In MiniMax queue |
| `processing` | Currently generating |
| `cancelling` | Cancellation requested |
| `cancelled` | Successfully cancelled |
| `success` | Generation completed |
| `fail` | Generation failed |
| `retrying` | Automatic retry in progress |
