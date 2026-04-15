# Instagram Reels MVP Core - Initiative Context

## Overview

Complete the core functionality of the Instagram Reels generation system to achieve a working MVP. Focus on CRUD operations, agent system functionality, and end-to-end video generation workflow. **Exclude Remotion compositions** - they will be addressed in a future initiative.

## Verified Current State

### Architecture
- **Database**: SQLite with tables: projects, videos, scenes, events, agent_sessions, session_tool_calls
- **API**: Express server with Hono agent routes at `/api/agent/*`
- **Services**: VideoService, SceneService, ProjectService, EventService, MiniMaxService
- **CLI**: Commander-based with create, list, status, render, build commands
- **Frontend**: React + Vite with Projects, Videos, Pipeline views

### Implemented Components
| Component | Status | Notes |
|-----------|--------|-------|
| Database schema | ✅ Complete | All tables with indexes |
| Express API routes | ✅ Complete | Projects, videos, scenes, events, agent routes |
| AgentFactory | ✅ Complete | Registry pattern for 4 scene agent types |
| Base Agent class | ✅ Complete | Abstract class with tool registration |
| SessionManager | ✅ Complete | CRUD for agent_sessions table |
| MiniMax integration | ✅ Complete | Video generation with polling |
| CLI commands | ✅ Complete | Dev, create, list, status, render, build |
| Projects UI | ✅ Complete | Grid, create modal, detail view |
| Videos list UI | ✅ Complete | Table view with status |
| Pipeline view | ✅ Complete | Visual workflow display |

### Incomplete/Missing Components
| Component | Status | Gap |
|-----------|--------|-----|
| Scene agent implementations | 🟡 Stubs | Only constructor, no tools/prompts |
| Agent tools | 🟡 Minimal | Only editSceneCode tool exists |
| Agent prompts | 🟡 Empty | Directory exists, content needed |
| Video detail view | ❌ Missing | UI shows placeholder alerts |
| Video player | ❌ Missing | No playback component |
| Scene code editing | 🟡 Partial | Callbacks exist but not wired end-to-end |
| Error recovery flows | 🟡 Partial | Basic retry, needs comprehensive handling |
| Export/publish | 🟡 Partial | Routes exist, implementation incomplete |

## Project Hierarchy

```
Projects (context_id → context files)
  └── Videos (status workflow)
        └── Scenes (sequence, duration, MiniMax generation)
              └── Agent Sessions (per-scene conversation)
                    └── Tool Calls (editSceneCode, etc.)
```

## Video Status Workflow

```
draft → generating_idea → idea_ready → generating_clips → clips_ready → composing → completed
         ↑                    ↓              ↓
       OpenCode            Auto-trigger   FFmpeg concat
       (structured)          MiniMax        (scenes.txt)
```

## Agent Session Flow

```
Scene created → Agent session initialized → User chat → Tool calls → Code edits
                     ↓
              Hook/Stats/CTA/Transition agent
                     ↓
              Scene-specific tools + prompts
```

## Tech Stack

- **Backend**: Node.js, Express, Hono, SQLite (better-sqlite3)
- **AI**: Vercel AI SDK, Anthropic Claude
- **Video**: MiniMax/Hailuo API, FFmpeg
- **Frontend**: React 18, Vite, Tailwind CSS
- **CLI**: Commander, chalk, ora

## Out of Scope (Future Initiatives)

1. **Remotion Composition Overlays** - Adding branded overlays, animations, transitions on top of MiniMax clips
2. **Advanced Analytics** - Video performance metrics
3. **Multi-tenant Support** - User authentication and isolation
4. **Template System** - Reusable video templates
5. **Social Media Publishing** - Direct Instagram/TikTok/YouTube uploads

## Key Constraints

- SQLite for simplicity (no migrations needed for MVP)
- Client-side video generation via MiniMax (not self-hosted)
- Single-user system (no auth)
- Local file storage (no S3)

## Success Criteria

1. ✅ Create project → Create video → Approve idea → Generate clips → Build video (full flow)
2. ✅ Agent chat works per scene with context-aware responses
3. ✅ Scene agents can edit code via tools
4. ✅ Video detail view shows all scenes with status
5. ✅ Can play generated clips before final build
6. ✅ Proper error handling and retry mechanisms

## Execution Order

Foundation → Core Features → Integration → UI Polish

See `dependency-graph.md` for detailed dependencies.
