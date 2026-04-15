# F-006: Video Detail UI & Player

## Objective

Rich video detail view with scene breakdown, video playback for preview, chat interface for agent interaction, and actions for approve/build workflow.

## Scope Boundaries

### In Scope
- Video detail page with full metadata
- Scene list with status indicators and ordering
- Video player for previewing generated clips
- Scene-level chat panel for agent interaction
- Approve/Build/Delete actions
- Scene reordering (drag and drop)
- Real-time status updates (SSE or polling)
- Download links for scenes and final video

### Out of Scope
- Inline video editing (use agent chat instead)
- Scene-level preview before generation
- Video trimming/cutting UI
- Timeline scrubber for final video
- Multi-video comparison view
- Batch scene operations

## Verified Context

### Existing Implementation
| Component | Location | Status |
|-----------|----------|--------|
| VideoTable | `src/components/videos/VideoTable.tsx` | List only |
| ProjectDetail | `src/components/projects/ProjectDetail.tsx` | Shows video list |
| Chat components | `src/components/chat/` | Directory exists |
| App routing | `src/App.tsx` | No video detail route |

### Current UI State (Verified)
```typescript
// App.tsx shows placeholder alerts:
onSelectVideo={(video) => {
  alert(`Video: ${video.title || video.id}\nEstado: ${video.status}\n\nNavegación a detalle de video pendiente de implementar.`);
}}
```

### API Endpoints Available (Verified)
```
GET  /api/videos/:id              - Video with scenes
GET  /api/videos/:id/status       - Status + progress
POST /api/videos/:id/approve      - Approve idea
POST /api/videos/:id/build        - Build final video
DELETE /api/videos/:id            - Delete video
GET  /api/scenes?videoId=:id      - List scenes
POST /api/scenes/:id/generate     - Generate scene
POST /api/scenes/:id/retry        - Retry failed
DELETE /api/scenes/:id            - Delete scene
```

### Agent Chat API (Verified)
```
POST /api/agent/sessions          - Create session
POST /api/agent/chat              - Chat (streaming)
GET  /api/agent/sessions/:id      - Get session
```

### Video File Structure (Verified)
```
videos/{video_id}/
├── scenes/scene-{sequence}.mp4   - Individual clips
└── output/final.mp4              - Concatenated final
```

## Implementation Notes

### Page Layout (Proposed)
```
┌─────────────────────────────────────────────────────────┐
│  Video Detail: {title}                    [Build] [×]  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │                     │  │ Scene List              │  │
│  │   Video Player      │  │ ┌─────────────────────┐ │  │
│  │   (current scene    │  │ │ 1. Hook      [✓]   │ │  │
│  │    or final video)  │  │ │ 2. Stats     [⋯]   │ │  │
│  │                     │  │ │ 3. CTA       [✗]   │ │  │
│  │   [Play/Pause]      │  │ │ 4. End       [○]   │ │  │
│  │   [Download]        │  │ └─────────────────────┘ │  │
│  │                     │  │                         │  │
│  └─────────────────────┘  │ [▲] [▼] reorder         │  │
│                           │                         │  │
│  Status: clips_ready      │ ┌─────────────────────┐ │  │
│  Progress: 2/3 scenes     │ │ Agent Chat          │ │  │
│                           │ │                     │ │  │
│  [Approve] [Retry Failed] │ │ User: ...           │ │  │
│                           │ │ Agent: ...          │ │  │
│                           │ │ [Tool result]       │ │  │
│                           │ │                     │ │  │
│                           │ └─────────────────────┘ │  │
│                           └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Components Needed

**New Components**:
- `VideoDetail.tsx` - Main page component
- `VideoPlayer.tsx` - Video playback with controls
- `SceneList.tsx` - Draggable scene list
- `SceneChatPanel.tsx` - Agent chat for selected scene
- `SceneStatusBadge.tsx` - Status indicator component
- `useVideoDetail.ts` - Data fetching hook

**Existing to Extend**:
- `App.tsx` - Add routing for video detail
- `VideoTable.tsx` - Link to detail view
- `ProjectDetail.tsx` - Link to detail view

### Routing (Proposed)
```typescript
// In App.tsx view state
type View = 
  | { type: 'projects' }
  | { type: 'project-detail'; project: ProjectWithCounts }
  | { type: 'videos' }
  | { type: 'video-detail'; video: VideoWithScenes }  // NEW
  | { type: 'pipeline' };
```

### Real-time Updates
Options:
1. **Polling**: `useEffect` with `setInterval` (simplest)
2. **SSE**: Server-Sent Events via `/events` endpoint (more efficient)

Recommend **polling** for MVP, migrate to SSE later.

### File Locations
- **Components**: `src/components/videos/VideoDetail.tsx`, `src/components/videos/VideoPlayer.tsx`
- **Hooks**: `src/hooks/useVideoDetail.ts`, `src/hooks/useAgentChat.ts`
- **Routes**: `src/App.tsx`

## Acceptance Criteria

- [ ] Can navigate to video detail from projects or videos list
- [ ] Video detail shows title, status, progress, created date
- [ ] Scene list shows all scenes with sequence, type, status
- [ ] Can reorder scenes with drag-and-drop (or buttons)
- [ ] Video player loads and plays selected scene or final video
- [ ] Can download individual scenes and final video
- [ ] Chat panel shows agent conversation for selected scene
- [ ] Can send messages to agent and see streaming response
- [ ] Tool results display in chat (code previews, etc.)
- [ ] Approve/Build/Delete actions work and show confirmation
- [ ] Real-time status updates (polling or SSE)
- [ ] Responsive layout (works on different screen sizes)

## Estimated Effort

**3 days**

- Day 1: VideoDetail component, routing, data fetching
- Day 2: VideoPlayer, SceneList with status, reordering
- Day 3: ChatPanel integration, actions, polish

## Dependencies

- **F-002** - Video Workflow (data, actions)
- **F-003** - Scene Management (scene data, reordering)
- **F-005** - Scene Agents (chat functionality)

## Suggested /plan Mode

`structured` - Multiple UI components, hooks, integration points.

## Open Questions

1. Should video player auto-play on selection or manual start?
2. Should we show all scenes concatenated or individual selection?
3. How to handle very long chat histories (virtual scrolling)?
4. Should reordering immediately update sequence numbers?

## Verification Steps

```bash
# Start dev server
pnpm run dev

# Navigate to UI
open http://localhost:5173

# Test flow:
# 1. Create project
# 2. Create video (get idea)
# 3. Click video → Video Detail page
# 4. Verify: scenes list, player, chat panel visible
# 5. Click scene → Chat with agent
# 6. Approve idea (if not already)
# 7. Wait for clips_ready
# 8. Build video
# 9. Play final video
```

## Integration Test Checklist

After all F-001 to F-006 complete:

- [ ] Full flow: Create project → Create video → Approve → Generate scenes → Build → Preview
- [ ] Agent flow: Select scene → Chat with agent → Tool execution → Code edit → Regenerate
- [ ] Error flow: Failed scene → Retry → Success → Build
- [ ] Cleanup flow: Delete video → Files removed → Navigate back
