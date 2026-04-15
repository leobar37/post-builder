# T-004 Verify Videos CRUD

## Objective

Verify that videos CRUD operations work end-to-end via the API.

## Requirements Covered

- `FR-004` - Videos CRUD operations

## Dependencies

- `T-001` (API must be running)
- `T-003` (Projects must work first - videos belong to projects)

## Files or Areas Involved

- `api/routes/videos.ts` - **Review** - Verify route handlers
- `api/services/video.service.ts` - **Review** - Verify business logic (note: lowercase `s` in service)
- `api/db/repositories/video.repository.ts` - **Review** - Verify data access
- `src/hooks/useVideos.ts` - **Review** - Verify frontend usage

## Actions

1. Ensure API is still running from T-003
2. First create a project (required for videos):
   ```bash
   curl -X POST http://localhost:3458/api/projects \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Project for Videos","description":"Test","context_id":"test-video-001"}'
   ```
3. Test creating a video:
   ```bash
   curl -X POST http://localhost:3458/api/projects/<project_id>/videos \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Create a fitness video about home workouts"}'
   ```
   Note: This may fail or take time because it calls OpenCode SDK - may return 500 if `OPENCODE_API_KEY` not configured
4. Test listing all videos: `curl http://localhost:3458/api/videos`
5. Test listing project videos: `curl http://localhost:3458/api/projects/<project_id>/videos`
6. Test getting single video: `curl http://localhost:3458/api/videos/<id>`
7. Test deleting video: `curl -X DELETE http://localhost:3458/api/videos/<id>`
8. Verify all CRUD operations return correct status codes

## Completion Criteria

- Video creation may fail if OpenCode not configured, but route should respond (not crash)
- All CRUD operations return expected status codes
- Database correctly persists video records
- `pnpm typecheck` still passes

## Validation

- Run each curl command and verify:
  - Create (may fail with 500 due to OpenCode, but should not crash server)
  - List returns `200` with `{"videos":[...],"total":...}`
  - Get returns video object or `404`
  - Delete returns `200` with `{"success":true}`

## Risks or Notes

- Video creation requires OpenCode SDK integration - may fail without API key
- Video status flow: `draft` → `generating_idea` → `idea_ready` → `generating_clips` → `clips_ready` → `composing` → `completed`
- The `api/services/video-service.ts` (lowercase `s`) was the file that replaced the deleted `api/services/video-service.ts` (uppercase `S`)
