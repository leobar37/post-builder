# F-004: Agent Session System

## Objective

Working agent session management for per-scene conversations with streaming responses, message persistence, and proper session lifecycle management.

## Scope Boundaries

### In Scope
- Session creation per scene (one session per scene)
- Chat endpoint with streaming responses (SSE)
- Message persistence (user + assistant messages)
- Session retrieval by ID, scene, or video
- Session archival (soft delete)
- Context-aware responses using scene/video/project metadata
- Tool call logging for debugging

### Out of Scope
- Multi-session per scene (one-to-many)
- Session sharing between users
- Session migration between scenes
- Real-time collaboration (multiple users)
- Session analytics/metrics

## Verified Context

### Existing Implementation
| Component | Location | Status |
|-----------|----------|--------|
| Agent routes | `api/routes/agent.ts` | Hono routes, streaming |
| SessionManager | `api/agent/core/SessionManager.ts` | CRUD + queries |
| Agent base class | `api/agent/core/Agent.ts` | Abstract with tools |
| AgentFactory | `api/agent/AgentFactory.ts` | Registry pattern |

### Database Schema (Verified)
```sql
CREATE TABLE agent_sessions (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  scene_type TEXT CHECK(scene_type IN ('hook', 'stats', 'cta', 'transition')),
  status TEXT DEFAULT 'active',
  messages TEXT NOT NULL DEFAULT '[]', -- JSON array
  metadata TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session_tool_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_input TEXT NOT NULL,
  tool_output TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  error TEXT
);
```

### Session Flow (Verified)
```
Scene created
    ↓
Frontend: POST /api/agent/sessions
    { sceneId, videoId, projectId, sceneType }
    ↓
SessionManager.getOrCreateSession()
    ↓
Check if session exists for this scene
    ├── Yes → Return existing
    └── No → Create new
    ↓
Return: { sessionId, status: 'created' }
```

### Chat Flow (Verified)
```
Frontend: POST /api/agent/chat
    { sessionId, message }
    ↓
SessionManager.getSession(sessionId)
    ↓
AgentFactory.getAgent(sceneType, config)
    ↓
Agent.processMessage(session, message)
    ├── Build system prompt (abstract)
    ├── streamText() with Vercel AI SDK
    └── Tool execution if needed
    ↓
Stream response (SSE)
    ↓
Save assistant message to session
```

## Implementation Notes

### Current Gaps
1. **System prompts** - Agent.buildSystemPrompt() is abstract, no implementations
2. **Tool execution logging** - session_tool_calls table exists but may not be populated
3. **Session expiration** - No cleanup for old sessions
4. **Message size limits** - No validation on message content size
5. **Error streaming** - Error handling in stream needs improvement

### Agent Configuration (Verified)
```typescript
interface AgentConfig {
  model: string;              // claude-3-5-sonnet-20241022
  apiKey: string;             // ANTHROPIC_API_KEY
  temperature: number;         // 0.7
  maxSteps: number;          // 5
}
```

### Session Metadata Structure
```typescript
interface VideoEditorSessionMetadata {
  sceneId: string;
  videoId: string;
  projectId: string;
  sceneType: 'hook' | 'stats' | 'cta' | 'transition';
}
```

### File Locations
- **Routes**: `api/routes/agent.ts`
- **Core**: `api/agent/core/SessionManager.ts`, `api/agent/core/Agent.ts`
- **Types**: `api/agent/core/types.ts`
- **Database**: `api/db/client.ts` (session queries)

## Acceptance Criteria

- [ ] Can create session for a scene
- [ ] Same scene returns existing session (getOrCreate)
- [ ] Chat endpoint streams responses (SSE)
- [ ] User messages saved to session
- [ ] Assistant messages saved after stream completes
- [ ] Can retrieve session by ID
- [ ] Can list sessions by scene or video
- [ ] Tool calls logged to session_tool_calls table
- [ ] Can archive/delete session
- [ ] Invalid session returns 404
- [ ] Missing sceneType falls back to 'hook' agent

## Estimated Effort

**2 days**

- Day 1: SessionManager improvements, message persistence, tool logging
- Day 2: Streaming error handling, session queries, testing

## Dependencies

- **F-003** - Scene Management (sessions need scene_id)
- **F-005** - Scene Agents (uses session system)

## Suggested /plan Mode

`simple` - Core session functionality exists, needs refinement.

## Open Questions

1. Should sessions auto-expire after inactivity?
2. Maximum message count per session before archiving?
3. Should we compress old messages or move to cold storage?
4. How to handle very long chat histories (context window limits)?

## Verification Steps

```bash
# Create/get session
curl -X POST http://localhost:3458/api/agent/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sceneId": "scene-xxx",
    "videoId": "video-xxx",
    "projectId": "project-xxx",
    "sceneType": "hook"
  }'

# Chat with streaming
curl -X POST http://localhost:3458/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-xxx",
    "message": "Create a hook scene about gym motivation"
  }'

# Get session
curl http://localhost:3458/api/agent/sessions/session-xxx

# List by video
curl "http://localhost:3458/api/agent/sessions?videoId=video-xxx"

# Archive
curl -X DELETE http://localhost:3458/api/agent/sessions/session-xxx
```

## Integration with F-005

This feature provides the foundation for F-005 (Scene Agents). Once F-004 is complete:

1. HookAgent can use sessions for hook-specific conversations
2. StatsAgent can use sessions for statistics presentations
3. CTAAgent can use sessions for call-to-action optimization
4. TransitionAgent can use sessions for scene transitions

Each agent type will register with AgentFactory and provide:
- Custom system prompt
- Agent-specific tools
- Scene-type-specific behavior
