# F-005: Scene Agents Implementation

## Objective

Fully functional Hook, Stats, CTA, and Transition agents with agent-specific tools, prompt templates, and code editing capabilities via OpenCode.

## Scope Boundaries

### In Scope
- Complete 4 scene agent implementations:
  - **HookAgent** - Creates attention-grabbing opening scenes
  - **StatsAgent** - Presents data/statistics effectively
  - **CTAAgent** - Compelling call-to-action scenes
  - **TransitionAgent** - Smooth scene transitions
- Agent-specific tool sets per agent type
- Prompt templates for each agent (system prompts + examples)
- Tool invocation logging and error handling
- Code editing via OpenCode integration
- Scene preview generation

### Out of Scope
- Agent training/fine-tuning
- Custom agent creation by users
- Agent-to-agent communication
- Agent marketplace
- Agent performance analytics

## Verified Context

### Existing Implementation
| Component | Location | Status |
|-----------|----------|--------|
| AgentFactory | `api/agent/AgentFactory.ts` | Registry, complete |
| Base Agent | `api/agent/core/Agent.ts` | Abstract, complete |
| HookAgent | `api/agent/scenes/HookAgent.ts` | Stub |
| StatsAgent | `api/agent/scenes/StatsAgent.ts` | Stub |
| CTAAgent | `api/agent/scenes/CTAAgent.ts` | Stub |
| TransitionAgent | `api/agent/scenes/TransitionAgent.ts` | Stub |
| Prompts dir | `api/agent/scenes/prompts/` | Empty |
| Tools dir | `api/agent/scenes/tools/` | Minimal |

### Current Agent Stubs (Verified)
```typescript
// All 4 agents look like this:
export class HookAgent extends Agent {
  constructor(config: AgentConfig) {
    super(config);
    // No tools registered!
    // No system prompt!
  }

  protected buildSystemPrompt(): string {
    return "You are a hook scene agent."; // Too minimal
  }

  protected getModel() {
    return anthropic(this.config.model);
  }
}
```

### VideoEditorAgent (Reference Implementation)
Located at `api/agent/video-editor/VideoEditorAgent.ts` - shows pattern:
- Constructor registers tools
- buildSystemPrompt() uses template + context
- Has working editSceneCode tool

### Tool System (Verified)
```typescript
// Tools are registered in constructor
this.registerTool('toolName', {
  parameters: z.object({...}),
  execute: async (args) => { ... }
});
```

### OpenCode Integration (Verified)
- **SDK**: `api/core/opencode/sdk.ts`
- **Callback**: `api/routes/agent-callbacks.ts`
- **Flow**: Agent calls tool → OpenCode SDK → Code edit → Callback updates scene

## Implementation Notes

### Agent Responsibilities

| Agent | Primary Goal | Typical Tools |
|-------|--------------|---------------|
| HookAgent | Grab attention in 3s | generateHookText, previewHook |
| StatsAgent | Present data clearly | generateStatsVisual, formatNumbers |
| CTAAgent | Drive action/clicks | generateCTA, optimizePlacement |
| TransitionAgent | Smooth scene flow | generateTransition, timingAdjust |

### Required Tools (Proposed)

**All Agents**:
- `editSceneCode` - Modify scene code via OpenCode
- `getSceneContext` - Retrieve scene/video/project context
- `updateSceneMetadata` - Update description, duration, etc.

**HookAgent**:
- `generateHookText` - Create attention-grabbing text
- `suggestHookStyle` - Recommend visual style
- `previewHook` - Generate preview frame

**StatsAgent**:
- `formatStat` - Format numbers (1.2K, 1M, etc.)
- `suggestChartType` - Bar, pie, line recommendations
- `validateData` - Check data plausibility

**CTAAgent**:
- `generateCTA` - Create call-to-action text
- `suggestPlacement` - Position recommendations
- `a/bTestCTA` - Alternative versions

**TransitionAgent**:
- `generateTransition` - Create transition effect
- `matchPacing` - Adjust to video rhythm
- `suggestMusicCue` - Audio transition points

### Prompt Template Structure

Each agent needs:
1. **System prompt** (`prompts/{agentType}-system.md`)
2. **Examples** (`prompts/{agentType}-examples.md`)
3. **Context injection** - Brand, audience, scene data

### File Locations
- **Agents**: `api/agent/scenes/{Hook,Stats,CTA,Transition}Agent.ts`
- **Prompts**: `api/agent/scenes/prompts/*.md`
- **Tools**: `api/agent/scenes/tools/*.ts`
- **Registration**: `api/agent/AgentFactory.ts` (already registered)

## Acceptance Criteria

- [ ] HookAgent has working tools and prompts
- [ ] StatsAgent has working tools and prompts
- [ ] CTAAgent has working tools and prompts
- [ ] TransitionAgent has working tools and prompts
- [ ] Each agent has unique system prompt
- [ ] Agents can call editSceneCode tool successfully
- [ ] Tool calls are logged to session_tool_calls
- [ ] Agents understand scene context (brand, audience, position)
- [ ] Can chat with each agent type via API
- [ ] Agents provide actionable, specific suggestions

## Estimated Effort

**5 days**

- Day 1: HookAgent + tools + prompts
- Day 2: StatsAgent + tools + prompts
- Day 3: CTAAgent + tools + prompts
- Day 4: TransitionAgent + tools + prompts
- Day 5: Integration testing, refinements, shared tools

## Dependencies

- **F-004** - Agent Sessions (uses SessionManager, chat endpoints)
- **F-003** - Scene Management (code editing callbacks)

## Suggested /plan Mode

`structured` - 4 parallel agent implementations + shared tooling.

## Parallelization Notes

**Can develop in parallel** (once F-004 is done):
- Developer 1: HookAgent + StatsAgent
- Developer 2: CTAAgent + TransitionAgent
- Both share: editSceneCode tool, common utilities

## Open Questions

1. Should agents have access to previous scenes for context?
2. How much code editing autonomy should agents have?
3. Should agents suggest MiniMax prompts or just scene code?
4. How to prevent agents from making conflicting edits?

## Verification Steps

```bash
# Test HookAgent
curl -X POST http://localhost:3458/api/agent/sessions \
  -d '{"sceneId":"xxx","videoId":"xxx","projectId":"xxx","sceneType":"hook"}'

curl -X POST http://localhost:3458/api/agent/chat \
  -d '{"sessionId":"xxx","message":"Create an energetic hook for a gym promo"}'
# Should: suggest hook text, offer to edit code, be context-aware

# Verify tool calls logged
sqlite3 data/app.db "SELECT * FROM session_tool_calls WHERE session_id='xxx'"

# Repeat for stats, cta, transition agent types
```

## Integration with F-006

Once agents are complete, F-006 (Video Detail UI) will provide:
- Chat interface per scene
- Tool result visualization
- Code preview before applying
- Agent switcher (if needed)
