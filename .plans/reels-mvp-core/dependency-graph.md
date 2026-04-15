# Instagram Reels MVP Core - Dependency Graph

## Visual Dependency Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FOUNDATION LAYER                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   F-001         │  │   F-002         │  │   F-003         │                │
│  │ Project CRUD    │  │ Video Workflow  │  │ Scene Mgmt      │                │
│  │                 │  │                 │  │                 │                │
│  │ • Create        │  │ • Idea gen      │  │ • MiniMax       │                │
│  │ • Update        │  │ • Status flow   │  │ • Polling       │                │
│  │ • Delete        │  │ • Build         │  │ • Retry         │                │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                │
│           │                    │                    │                         │
│           │                    │                    │                         │
│           └────────────────────┴────────────────────┘                         │
│                              │                                              │
│                              ▼                                              │
│                    ┌─────────────────┐                                      │
│                    │   Database      │                                      │
│                    │   (SQLite)      │                                      │
│                    │                 │                                      │
│                    │ • projects      │                                      │
│                    │ • videos        │                                      │
│                    │ • scenes        │                                      │
│                    └─────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT SYSTEM LAYER                                 │
│                                                                              │
│  ┌─────────────────┐              ┌─────────────────┐                        │
│  │   F-004         │◄─────────────│   F-003         │                        │
│  │ Agent Sessions  │  needs scenes │ Scene Mgmt      │                        │
│  │                 │              │                 │                        │
│  │ • Create        │              │                 │                        │
│  │ • Chat          │              │                 │                        │
│  │ • Stream        │              │                 │                        │
│  └────────┬────────┘              └─────────────────┘                        │
│           │                                                                 │
│           │ uses                                                            │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         F-005                                      │   │
│  │                    Scene Agents                                     │   │
│  │                                                                    │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐     │   │
│  │  │ HookAgent │  │StatsAgent │  │ CTAAgent  │  │Transition │     │   │
│  │  │           │  │           │  │           │  │  Agent    │     │   │
│  │  │ • Prompts │  │ • Prompts │  │ • Prompts │  │ • Prompts │     │   │
│  │  │ • Tools   │  │ • Tools   │  │ • Tools   │  │ • Tools   │     │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘     │   │
│  │                                                                    │   │
│  │  Shared: AgentFactory, Base Agent, SessionManager                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ provides data
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         F-006                                      │   │
│  │                    Video Detail UI                                  │   │
│  │                                                                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │ Video Player│  │ Scene List  │  │ Actions     │               │   │
│  │  │             │  │             │  │             │               │   │
│  │  │ • Playback  │  │ • Status    │  │ • Approve   │               │   │
│  │  │ • Progress  │  │ • Reorder   │  │ • Build     │               │   │
│  │  │ • Download  │  │ • Edit      │  │ • Delete    │               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  │                                                                    │   │
│  │  Dependencies: F-002 (video data), F-003 (scenes), F-005 (edit)  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Dependencies

### F-001: Project CRUD Operations
**No dependencies** - Foundation feature

**Provides to**:
- F-002 (Video Workflow) - projects table, project service
- F-006 (Video Detail UI) - project metadata display

---

### F-002: Video CRUD & Workflow
**Depends on**:
- F-001 (Project CRUD) - projects must exist, context validation

**Provides to**:
- F-003 (Scene Management) - video_id for scenes, status workflow
- F-004 (Agent Sessions) - video_id for sessions
- F-006 (Video Detail UI) - video data, status, scenes

**Shared Dependencies**:
- Database: videos table
- Services: VideoService, EventService
- External: OpenCode SDK (idea generation)

---

### F-003: Scene Management & MiniMax
**Depends on**:
- F-002 (Video Workflow) - video_id, approveIdea triggers scene generation

**Provides to**:
- F-004 (Agent Sessions) - scene_id for sessions
- F-005 (Scene Agents) - scene data, code editing integration
- F-006 (Video Detail UI) - scene list, status

**Shared Dependencies**:
- Database: scenes table
- Services: SceneService, MiniMaxService
- External: MiniMax/Hailuo API

---

### F-004: Agent Session System
**Depends on**:
- F-003 (Scene Management) - scene_id, video_id for session context

**Provides to**:
- F-005 (Scene Agents) - session management, chat streaming
- F-006 (Video Detail UI) - chat interface per scene

**Shared Dependencies**:
- Database: agent_sessions table
- Services: SessionManager
- External: Vercel AI SDK, Anthropic API

---

### F-005: Scene Agents Implementation
**Depends on**:
- F-004 (Agent Sessions) - session management, message persistence
- F-003 (Scene Management) - code editing callbacks, scene data

**Provides to**:
- F-006 (Video Detail UI) - chat tools, code editing UI

**Internal Dependencies**:
```
AgentFactory
    ├── HookAgent
    ├── StatsAgent
    ├── CTAAgent
    └── TransitionAgent

Each agent has:
    ├── Prompts (text files)
    ├── Tools (TypeScript implementations)
    └── Base Agent (abstract class)
```

**Shared Dependencies**:
- Database: session_tool_calls table (audit log)
- Services: AgentFactory
- External: OpenCode SDK (code editing)

---

### F-006: Video Detail UI & Player
**Depends on**:
- F-002 (Video Workflow) - video data, approve/build actions
- F-003 (Scene Management) - scene list, status, MiniMax URLs
- F-005 (Scene Agents) - chat interface, code editing

**No downstream dependencies** - UI is leaf node

**Shared Dependencies**:
- Components: VideoPlayer, SceneList, ChatPanel
- Hooks: useVideo, useScenes, useAgentSession

---

## Data Flow Dependencies

### Video Creation Flow
```
User (UI) → Projects API → VideoService → OpenCode (idea) → Database
                              ↓
                         SceneService → Database (scenes created)
                              ↓
                         EventService → Events table
```

### Scene Generation Flow
```
User approves → VideoService → SceneService → MiniMaxService
                                              ↓
                                         MiniMax API
                                              ↓
                                         Polling → Database update
                                              ↓
                                         EventService (progress)
```

### Agent Chat Flow
```
User (UI) → Agent API → SessionManager → AgentFactory → Specific Agent
                                           ↓
                                    Vercel AI SDK → Anthropic API
                                           ↓
                                    Tool Execution (if needed)
                                           ↓
                                    OpenCode SDK (code editing)
                                           ↓
                                    Database (messages, tool_calls)
```

## Parallelization Opportunities

### Can Run in Parallel (Wave 1)
- F-001 (Project CRUD) and F-003 (Scene Management) - partially independent
  - F-003 needs F-002 which needs F-001
  - So sequential: F-001 → F-002 → F-003

### Can Run in Parallel (Wave 2)
- F-004 (Agent Sessions) and F-005 internal agents
  - F-005 agents can be developed in parallel once F-004 is complete
  - HookAgent + StatsAgent in parallel
  - CTAAgent + TransitionAgent in parallel

### Can Run in Parallel (Wave 3)
- F-006 (Video Detail UI) components:
  - VideoPlayer component
  - SceneList component
  - ChatPanel component

## Circular Dependency Check

✅ **No circular dependencies detected**

All dependencies flow:
```
F-001 → F-002 → F-003 → F-004 → F-005
                         ↓
                    F-006 ←──────┘
```

## External API Dependencies

| Feature | External API | Risk Level |
|---------|--------------|------------|
| F-002 | OpenCode SDK | Medium - requires API key |
| F-003 | MiniMax/Hailuo | Medium - rate limits, queue |
| F-004 | Anthropic API | Low - standard integration |
| F-005 | OpenCode SDK | Medium - callback handling |

## Database Table Dependencies

```
projects (F-001)
    └── videos (F-002)
            ├── scenes (F-003)
            │       └── agent_sessions (F-004)
            │               └── session_tool_calls (F-005)
            └── events (all features)
```

## Execution Order Summary

**Valid execution sequences**:

1. Sequential (safest):
   F-001 → F-002 → F-003 → F-004 → F-005 → F-006

2. Parallelized (optimal for team):
   - Week 1: F-001 + F-002
   - Week 2: F-003 + start F-004
   - Week 3: F-004 + F-005 (parallel agents)
   - Week 4: F-006 + integration

3. MVP-first (minimal flow):
   F-001 → F-002 → F-003 → F-006 (skip agents for v0)
