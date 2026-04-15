# Instagram Reels MVP Core - Feature Index

## Summary

| ID | Feature | Status | Priority | Est. Effort | Owner |
|----|---------|--------|----------|-------------|-------|
| F-001 | Project CRUD Operations | Pending | High | 2 days | TBD |
| F-002 | Video CRUD & Workflow | Pending | High | 3 days | TBD |
| F-003 | Scene Management & MiniMax | Pending | High | 3 days | TBD |
| F-004 | Agent Session System | Pending | High | 2 days | TBD |
| F-005 | Scene Agents Implementation | Pending | High | 5 days | TBD |
| F-006 | Video Detail UI & Player | Pending | High | 3 days | TBD |

## Features

### F-001: Project CRUD Operations
**Objective**: Ensure complete project lifecycle management with proper validation and error handling.

**Scope**:
- Create project with context initialization
- Update project metadata
- Delete project (cascade to videos)
- List projects with video counts
- Validate context_id exists in filesystem

**Brief**: [features/F-001-project-crud.md](./features/F-001-project-crud.md)

---

### F-002: Video CRUD & Workflow
**Objective**: Complete video lifecycle from creation through final build with proper status transitions.

**Scope**:
- Create video from project with OpenCode idea generation
- Video status workflow enforcement
- Approve idea and trigger clip generation
- Build final video with FFmpeg
- Delete video with cleanup
- Retry failed videos

**Brief**: [features/F-002-video-workflow.md](./features/F-002-video-workflow.md)

---

### F-003: Scene Management & MiniMax Integration
**Objective**: Robust scene operations with MiniMax video generation and status tracking.

**Scope**:
- CRUD operations for scenes
- MiniMax video generation with polling
- Scene retry for failures
- Scene cancellation
- Progress tracking across scenes

**Brief**: [features/F-003-scene-management.md](./features/F-003-scene-management.md)

---

### F-004: Agent Session System
**Objective**: Working agent session management for per-scene conversations.

**Scope**:
- Session creation per scene
- Chat with streaming responses
- Message persistence
- Session archival
- Context-aware responses

**Brief**: [features/F-004-agent-sessions.md](./features/F-004-agent-sessions.md)

---

### F-005: Scene Agents Implementation
**Objective**: Fully functional Hook, Stats, CTA, and Transition agents with tools and prompts.

**Scope**:
- Complete 4 scene agent implementations
- Agent-specific tool sets
- Prompt templates per agent type
- Tool invocation logging
- Code editing via OpenCode

**Brief**: [features/F-005-scene-agents.md](./features/F-005-scene-agents.md)

---

### F-006: Video Detail UI & Player
**Objective**: Rich video detail view with scene breakdown and video playback.

**Scope**:
- Video detail page with metadata
- Scene list with status indicators
- Video player for preview
- Scene reordering
- Build/approve actions

**Brief**: [features/F-006-video-detail-ui.md](./features/F-006-video-detail-ui.md)

---

## Feature Dependencies

```
F-001 (Project CRUD)
    └── F-002 (Video Workflow)
            ├── F-003 (Scene Management)
            │       └── F-004 (Agent Sessions)
            │               └── F-005 (Scene Agents)
            └── F-006 (Video Detail UI)
```

## Execution Waves

### Wave 1: Foundation (Days 1-5)
- F-001: Project CRUD Operations
- F-002: Video CRUD & Workflow
- F-003: Scene Management & MiniMax

### Wave 2: Agent System (Days 6-10)
- F-004: Agent Session System
- F-005: Scene Agents Implementation

### Wave 3: UI Completion (Days 11-13)
- F-006: Video Detail UI & Player

### Wave 4: Integration & Polish (Days 14)
- End-to-end testing
- Bug fixes
- Documentation

## Status Legend

- **Pending**: Not started
- **In Progress**: Currently being implemented
- **Blocked**: Waiting on dependency
- **In Review**: Code review phase
- **Completed**: Merged and verified

## Changes Log

| Date | Change | Notes |
|------|--------|-------|
| 2026-04-10 | Initial index created | 6 features defined for MVP Core |
