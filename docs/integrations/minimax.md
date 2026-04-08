# MiniMax Hailuo AI Integration

## API Overview

MiniMax Hailuo AI provides text-to-video generation capabilities.

**Base URL**: `https://api.minimax.io/v1`
**Docs**: https://platform.minimax.io/docs/guides/video-generation

## Authentication

```bash
export MINIMAX_API_KEY="your-api-key"
```

## Endpoints

### 1. Create Video Generation

```http
POST /video_generation
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "model": "MiniMax-Hailuo-02",
  "prompt": "A serene mountain landscape with flowing clouds",
  "duration": 6,
  "resolution": "1080p"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `model` | string | No | MiniMax-Hailuo-02 | Model version |
| `prompt` | string | Yes | - | Text description |
| `duration` | int | No | 6 | 6, 8, or 10 seconds |
| `resolution` | string | No | 1080p | 720p or 1080p |
| `aspect_ratio` | string | No | 16:9 | 16:9 or 9:16 |

**Response:**

```json
{
  "task_id": "abc123-def456",
  "status": "queued",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. Query Generation Status

```http
GET /video_generation?task_id={task_id}
Authorization: Bearer {api_key}
```

**Response (queued):**

```json
{
  "task_id": "abc123-def456",
  "status": "queued",
  "base_resp": { "status_code": 0 }
}
```

**Response (processing):**

```json
{
  "task_id": "abc123-def456",
  "status": "processing",
  "progress": 45,
  "base_resp": { "status_code": 0 }
}
```

**Response (success):**

```json
{
  "task_id": "abc123-def456",
  "status": "success",
  "file_id": "file-xyz789",
  "video_url": "https://api.minimax.io/v1/files/file-xyz789",
  "base_resp": { "status_code": 0 }
}
```

**Response (fail):**

```json
{
  "task_id": "abc123-def456",
  "status": "fail",
  "base_resp": {
    "status_code": -1,
    "status_msg": "Generation failed: content policy violation"
  }
}
```

### 3. Download Video

```http
GET /files/{file_id}
Authorization: Bearer {api_key}
```

Returns: Binary video file (MP4)

## Status Values

| Status | Description |
|--------|-------------|
| `queued` | Waiting in queue |
| `processing` | Generating video |
| `success` | Complete, video ready |
| `fail` | Generation failed |

## Model Specifications

### MiniMax-Hailuo-02

- **Max Duration**: 10 seconds
- **Resolutions**: 720p, 1080p
- **Aspect Ratios**: 16:9, 9:16
- **Cost**: Per second of video

## Rate Limits

| Tier | Requests/min | Concurrent tasks |
|------|--------------|------------------|
| Free | 10 | 2 |
| Pro | 60 | 10 |
| Enterprise | Custom | Custom |

## Error Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| -1 | General error |
| -1001 | Invalid API key |
| -1002 | Rate limit exceeded |
| -2001 | Invalid parameters |
| -3001 | Content policy violation |

## Polling Strategy

```typescript
// Recommended polling intervals
const POLL_INTERVAL = 5000; // 5 seconds
const MAX_ATTEMPTS = 60;    // 5 minutes max
```

## Integration Flow

```
1. POST /video_generation (prompt, duration, resolution)
   → Returns task_id
   
2. GET /video_generation?task_id=xxx (every 5s)
   → Wait for status === 'success'
   
3. GET /files/{file_id}
   → Download video to local storage
   
4. Update database with video_url (local path)
```
