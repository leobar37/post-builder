# Instagram Reels MVP Core - Worktree Recommendations

## Summary

| Feature | Worktree Name | Branch Name | Base Branch | Estimated Duration |
|---------|---------------|-------------|-------------|-------------------|
| F-001 | project-crud | feat/project-crud | main | 2 days |
| F-002 | video-workflow | feat/video-workflow | main | 3 days |
| F-003 | scene-management | feat/scene-management | main | 3 days |
| F-004 | agent-sessions | feat/agent-sessions | main | 2 days |
| F-005 | scene-agents | feat/scene-agents | main | 5 days |
| F-006 | video-detail-ui | feat/video-detail-ui | main | 3 days |

## Recommended Strategy: Feature Branches

For this initiative with 2-4 week timeline, **feature branches** are recommended over worktrees because:
- Team size is likely small (1-2 developers)
- Features have clear dependencies (sequential development)
- Main branch should remain stable for demos
- Easier to manage with standard git workflows

## Worktree Alternative (if parallel development needed)

If you need to work on F-005 (Scene Agents) while F-004 (Agent Sessions) is in review:

```bash
# Create worktree for F-005 based on F-004 branch
git worktree add ../post-builder-agents feat/agent-sessions -b feat/scene-agents

# Or using wtp if configured
wtp create scene-agents --base feat/agent-sessions
```

## Individual Feature Worktree Configurations

### F-001: Project CRUD Operations

**Branch**: `feat/project-crud`
**Base**: `main`
**Bootstrap Commands**:
```bash
pnpm install
pnpm run typecheck
```

**Files to Watch**:
- `api/routes/projects.ts`
- `api/services/project.service.ts`
- `src/components/projects/*`
- `src/hooks/useProjects.ts`

**Validation**:
```bash
# After implementation
curl http://localhost:3458/api/projects
pnpm run typecheck
```

---

### F-002: Video CRUD & Workflow

**Branch**: `feat/video-workflow`
**Base**: `main` (after F-001 merged) OR `feat/project-crud`
**Bootstrap Commands**:
```bash
pnpm install
echo "OPENCODE_API_KEY=xxx" >> .env
```

**Files to Watch**:
- `api/routes/videos.ts`
- `api/services/video.service.ts`
- `api/services/event.service.ts`
- `src/components/videos/*`
- `src/hooks/useVideos.ts`

**Validation**:
```bash
# Start API
pnpm run dev:api

# Test workflow
pnpm cli create --post-id 1
pnpm cli status <video-id>
```

---

### F-003: Scene Management & MiniMax

**Branch**: `feat/scene-management`
**Base**: `main` (after F-002 merged)
**Bootstrap Commands**:
```bash
pnpm install
echo "MINIMAX_API_KEY=xxx" >> .env
```

**Files to Watch**:
- `api/routes/scenes.ts`
- `api/services/scene.service.ts`
- `api/services/minimax.service.ts`
- `api/db/repositories/scene.repository.ts`

**Validation**:
```bash
# Test MiniMax integration
pnpm cli render <video-id>

# Verify scenes table
sqlite3 data/app.db "SELECT * FROM scenes WHERE video_id='xxx'"
```

---

### F-004: Agent Session System

**Branch**: `feat/agent-sessions`
**Base**: `main` (after F-003 merged)
**Bootstrap Commands**:
```bash
pnpm install
echo "ANTHROPIC_API_KEY=xxx" >> .env
```

**Files to Watch**:
- `api/routes/agent.ts`
- `api/agent/core/SessionManager.ts`
- `api/agent/core/Agent.ts`
- `api/db/client.ts` (agent_sessions queries)

**Validation**:
```bash
# Test session creation
curl -X POST http://localhost:3458/api/agent/sessions \
  -H "Content-Type: application/json" \
  -d '{"sceneId":"xxx","videoId":"xxx","projectId":"xxx","sceneType":"hook"}'
```

---

### F-005: Scene Agents Implementation

**Branch**: `feat/scene-agents`
**Base**: `main` (after F-004 merged)
**Bootstrap Commands**:
```bash
pnpm install
# Ensure agent_sessions table exists
pnpm run dev:api
```

**Files to Watch**:
- `api/agent/scenes/HookAgent.ts`
- `api/agent/scenes/StatsAgent.ts`
- `api/agent/scenes/CTAAgent.ts`
- `api/agent/scenes/TransitionAgent.ts`
- `api/agent/scenes/prompts/*.md`
- `api/agent/scenes/tools/*.ts`
- `api/agent/AgentFactory.ts`

**Validation**:
```bash
# Test agent registration
pnpm cli dev
# Navigate to UI, create project → video → scene → chat with agent
```

**Sub-branches (if team > 2 people)**:
- `feat/scene-agents-hook` - HookAgent implementation
- `feat/scene-agents-stats` - StatsAgent implementation
- `feat/scene-agents-cta` - CTAAgent implementation
- `feat/scene-agents-transition` - TransitionAgent implementation

---

### F-006: Video Detail UI & Player

**Branch**: `feat/video-detail-ui`
**Base**: `main` (after F-003 and F-005 merged)
**Bootstrap Commands**:
```bash
pnpm install
pnpm run dev
```

**Files to Watch**:
- `src/components/videos/VideoDetail.tsx` (new)
- `src/components/videos/VideoPlayer.tsx` (new)
- `src/components/videos/SceneList.tsx` (new)
- `src/components/chat/ChatPanel.tsx` (if not exists)
- `src/App.tsx` (routing)

**Validation**:
```bash
# E2E test
pnpm run dev
# Click through: Projects → Project Detail → Video → Video Detail
# Verify: player loads, scenes list, chat works
```

---

## .wtp.yml Configuration (Optional)

If using [wtp](https://github.com/factoryai/wtp) for worktree management:

```yaml
# .wtp.yml
worktrees:
  project-crud:
    branch: feat/project-crud
    base: main
    copy: [package.json, pnpm-lock.yaml, .env]
    command: pnpm install

  video-workflow:
    branch: feat/video-workflow
    base: main
    copy: [package.json, pnpm-lock.yaml, .env]
    command: pnpm install

  scene-management:
    branch: feat/scene-management
    base: main
    copy: [package.json, pnpm-lock.yaml, .env]
    command: pnpm install

  agent-sessions:
    branch: feat/agent-sessions
    base: main
    copy: [package.json, pnpm-lock.yaml, .env]
    command: pnpm install

  scene-agents:
    branch: feat/scene-agents
    base: main
    copy: [package.json, pnpm-lock.yaml, .env]
    command: pnpm install

  video-detail-ui:
    branch: feat/video-detail-ui
    base: main
    copy: [package.json, pnpm-lock.yaml, .env]
    command: pnpm install
```

## Branch Strategy Visualization

```
main
├── feat/project-crud ────────────┐
│   (F-001)                       │
│   └── merge ────────────────────┤
│                                 ▼
├── feat/video-workflow ──────────┤
│   (F-002)                       │
│   └── merge ────────────────────┤
│                                 ▼
├── feat/scene-management ────────┤
│   (F-003)                       │
│   └── merge ────────────────────┤
│                                 ▼
├── feat/agent-sessions ──────────┤
│   (F-004)                       │
│   └── merge ────────────────────┤
│                                 ▼
├── feat/scene-agents ────────────┤
│   (F-005)                       │
│   └── merge ────────────────────┤
│                                 ▼
└── feat/video-detail-ui ─────────┤
    (F-006)                       │
    └── merge ────────────────────┘
```

## Parallel Development Scenarios

### Scenario 1: UI Developer + Backend Developer

**Backend dev**:
```bash
git checkout -b feat/scene-management main
# Work on F-003
```

**UI dev**:
```bash
git checkout -b feat/video-detail-ui main
# Mock API responses initially
# Switch to real API when F-003 merges
```

### Scenario 2: Multiple Agent Developers

**Dev 1** (Hook + Stats):
```bash
git checkout -b feat/scene-agents-hook feat/agent-sessions
# Implement HookAgent
```

**Dev 2** (CTA + Transition):
```bash
git checkout -b feat/scene-agents-cta feat/agent-sessions
# Implement CTAAgent
```

Merge both into `feat/scene-agents` before merging to main.

## Cleanup After Completion

```bash
# After all features merged to main
git branch -d feat/project-crud
git branch -d feat/video-workflow
git branch -d feat/scene-management
git branch -d feat/agent-sessions
git branch -d feat/scene-agents
git branch -d feat/video-detail-ui

# If using worktrees
rm -rf ../post-builder-project-crud
rm -rf ../post-builder-video-workflow
# ... etc
```

## Recommendations

1. **Start with F-001 on main directly** if team size = 1
2. **Use feature branches** for F-002 through F-006
3. **Consider worktrees** only if doing heavy parallel development on F-005 sub-agents
4. **Merge F-001, F-002, F-003 quickly** to establish stable foundation
5. **Keep .wtp.yml updated** if using wtp tool
