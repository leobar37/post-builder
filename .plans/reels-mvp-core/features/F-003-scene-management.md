# F-003: Scene Management & MiniMax Integration

## Objective

Robust scene operations with MiniMax video generation, polling for completion, status tracking, and error recovery with retry capability.

## Scope Boundaries

### In Scope
- CRUD operations for scenes (create, read, update, delete)
- MiniMax video generation with async polling
- Scene retry for failed generations
- Scene cancellation (best-effort)
- Progress tracking across all scenes in a video
- Scene sequence management (ordering)
- Clip file management and cleanup

### Out of Scope
- Scene templates/presets
- Scene-level preview before generation
- Scene branching (A/B testing)
- Manual clip upload (must use MiniMax)

## Verified Context

### Existing Implementation
| Component | Location | Status |
|-----------|----------|--------|
| Scenes route | `api/routes/scenes.ts` | Basic CRUD |
| Scene service | `api/services/scene.service.ts` | MiniMax integration |
| Scene repository | `api/db/repositories/scene.repository.ts` | SQLite CRUD |
| MiniMax service | `api/services/minimax.service.ts` | API client |

### Scene Generation Flow (Verified)
```
Scene created with minimax_prompt
    ↓
SceneService.generateScene(sceneId)
    ↓
MiniMaxService.createVideoGeneration({prompt, duration, resolution})
    ↓
Returns: { taskId }
    ↓
Scene updated with minimax_task_id, status='queued'
    ↓
Polling loop (pollAndDownload)
    ↓
MiniMaxService.waitForCompletion(taskId, outputPath, callbacks)
    ↓
Status updates: queued → processing → success/fail
    ↓
Download to: videos/{video_id}/scenes/scene-{sequence}.mp4
```

### Database Schema (Verified)
```sql
CREATE TABLE scenes (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 6,
  scene_type TEXT CHECK(scene_type IN ('hook', 'stats', 'cta', 'transition')),
  minimax_task_id TEXT,
  minimax_status TEXT,
  minimax_prompt TEXT,
  clip_path TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### MiniMax Integration (Verified)
- **API**: MiniMax/Hailuo video generation
- **Durations**: 6s, 8s, 10s (schema constraint)
- **Resolution**: 1080p
- **Polling**: Configurable interval (default 5s)
- **Max attempts**: 60 (5 minutes timeout)

## Implementation Notes

### Current Gaps
1. **Scene deletion** - Cascades but may leave files
2. **Cancellation** - Marked as fail but MiniMax continues
3. **Retry limits** - No maximum retry count enforced
4. **Sequence gaps** - No validation for duplicate sequence numbers
5. **Scene type assignment** - Not automatically set based on position

### Status Mapping
```typescript
// MiniMax status → Our SceneStatus
const mapping = {
  'queued': 'queued',
  'processing': 'processing', 
  'success': 'success',
  'fail': 'fail'
};
```

### File Storage Structure
```
videos/
└── {video_id}/
    ├── scenes/
    │   ├── scene-01.mp4
    │   ├── scene-02.mp4
    │   └── scene-03.mp4
    ├── output/
    │   └── final.mp4
    └── scenes.txt (concat list for FFmpeg)
```

### File Locations
- **Backend**: `api/routes/scenes.ts`, `api/services/scene.service.ts`, `api/services/minimax.service.ts`
- **Database**: `api/db/repositories/scene.repository.ts`
- **CLI**: `cli/commands/render.ts`

## Acceptance Criteria

- [ ] Can create scene with minimax_prompt
- [ ] Scene generation triggers MiniMax API call
- [ ] Polling updates scene status in real-time
- [ ] Successful scenes have clip_path pointing to downloaded file
- [ ] Failed scenes have error_message populated
- [ ] Can retry failed scenes (increments retry_count)
- [ ] Can cancel queued/processing scenes (marks as fail)
- [ ] Scene sequence is maintained (order by sequence ASC)
- [ ] Video progress updates as scenes complete
- [ ] All scenes deleted when parent video deleted

## Estimated Effort

**3 days**

- Day 1: MiniMax integration hardening, polling improvements
- Day 2: Retry/cancel flow, error handling, file cleanup
- Day 3: Sequence validation, progress tracking, testing

## Dependencies

- **F-002** - Video Workflow (scenes belong to videos, triggered by approveIdea)

## Suggested /plan Mode

`structured` - Multiple durable tasks (MiniMax integration, retry flow, file management).

## Open Questions

1. Should we validate minimax_prompt length/content before sending?
2. How to handle MiniMax API rate limiting?
3. Should we implement exponential backoff for polling?
4. What happens if video is deleted during active MiniMax generation?

## Verification Steps

```bash
# Get video with scenes
curl http://localhost:3458/api/videos/<video-id>

# Trigger scene generation for specific scene
curl -X POST http://localhost:3458/api/scenes/<scene-id>/generate

# Check scene status
curl http://localhost:3458/api/scenes/<scene-id>

# Retry failed scene
curl -X POST http://localhost:3458/api/scenes/<scene-id>/retry

# Verify file exists
ls videos/<video-id>/scenes/scene-{sequence}.mp4
```
