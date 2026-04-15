# F-002: Video CRUD & Workflow

## Objective

Complete video lifecycle from creation through final build with proper status workflow enforcement, event tracking, and error recovery.

## Scope Boundaries

### In Scope
- Create video from project with OpenCode idea generation
- Video status workflow with validation
- Approve idea and trigger automatic clip generation
- Build final video by concatenating scenes with FFmpeg
- Delete video with file cleanup
- Retry failed videos
- List videos with filtering by status
- Event emission at each workflow step

### Out of Scope
- Video templates/presets
- Video duplication
- Batch video operations
- Video analytics/metrics

## Verified Context

### Existing Implementation
| Component | Location | Status |
|-----------|----------|--------|
| Videos route | `api/routes/videos.ts` | Full CRUD + workflow |
| Video service | `api/services/video.service.ts` | Idea gen, build, status |
| Video repository | `api/db/repositories/video.repository.ts` | SQLite CRUD |
| Videos UI | `src/components/videos/VideoTable.tsx` | List view |

### Video Status Workflow (Verified)
```
draft → generating_idea → idea_ready → generating_clips → clips_ready → composing → completed
                                                              ↓
                                                          failed (can retry from here)
```

### Database Schema (Verified)
```sql
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT CHECK(status IN ('draft', 'generating_idea', 'idea_ready', 'generating_clips', 'clips_ready', 'composing', 'completed', 'failed')),
  prompt TEXT,
  idea_title TEXT,
  idea_description TEXT,
  idea_json TEXT,
  total_scenes INTEGER DEFAULT 0,
  completed_scenes INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  output_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Key Methods (Verified)
- `createFromProject(projectId, prompt)` - Generates idea with OpenCode
- `approveIdea(videoId)` - Triggers MiniMax generation for all scenes
- `startRender(videoId)` - Currently no-op (Remotion placeholder)
- `buildFinalVideo(videoId)` - FFmpeg concatenation

## Implementation Notes

### Current Gaps
1. **Status enforcement** - Need strict validation of status transitions
2. **Retry flow** - Need complete retry implementation for failed videos
3. **File cleanup** - Delete should remove video files from disk
4. **Progress tracking** - Progress calculation needs verification
5. **Error recovery** - Failed states need clear retry/cancel actions

### Workflow Validation
```typescript
const validTransitions = {
  'draft': ['generating_idea'],
  'generating_idea': ['idea_ready', 'failed'],
  'idea_ready': ['generating_clips'],
  'generating_clips': ['clips_ready', 'failed'],
  'clips_ready': ['composing'],
  'composing': ['completed', 'failed'],
  'completed': [], // terminal
  'failed': ['generating_idea', 'generating_clips'] // retry paths
};
```

### File Locations
- **Backend**: `api/routes/videos.ts`, `api/services/video.service.ts`
- **Frontend**: `src/components/videos/*`, `src/hooks/useVideos.ts`
- **CLI**: `cli/commands/create.ts`, `cli/commands/status.ts`, `cli/commands/build.ts`

## Acceptance Criteria

- [ ] Can create video and get AI-generated idea with scenes
- [ ] Status transitions are validated (can't skip steps)
- [ ] Approve idea triggers scene generation automatically
- [ ] Build video concatenates all successful scenes
- [ ] Delete video removes files from `videos/{id}/`
- [ ] Retry works from failed state
- [ ] Events emitted: video_created, idea_ready, clips_ready, composition_completed, error
- [ ] Progress calculation is accurate
- [ ] CLI shows proper status and progress

## Estimated Effort

**3 days**

- Day 1: Status workflow enforcement, validation
- Day 2: Retry flow, file cleanup, error handling
- Day 3: Event system, CLI improvements, testing

## Dependencies

- **F-001** - Project CRUD (video needs project_id)
- **F-003** - Scene Management (approveIdea triggers scene generation)

## Suggested /plan Mode

`structured` - This has multiple durable tasks (status workflow, retry, cleanup, events).

## Open Questions

1. Should failed videos be automatically retried or manual only?
2. What happens if build is called with no successful scenes?
3. Should we keep intermediate scene files after final build?
4. How long to keep generated videos before cleanup?

## Verification Steps

```bash
# Full workflow test
pnpm cli create --post-id 1
# Note video-id

pnpm cli status <video-id>
# Should show: generating_idea → idea_ready

# Approve via API (or UI)
curl -X POST http://localhost:3458/api/videos/<video-id>/approve

# Wait for clips_ready
pnpm cli status <video-id>

# Build final video
pnpm cli build <video-id>

# Verify output
ls videos/<video-id>/output/final.mp4
```
