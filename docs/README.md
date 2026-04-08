# Video Pipeline System Documentation

## Overview

This documentation covers the Video Pipeline System for automated Instagram Reels generation using OpenCode AI, MiniMax Hailuo AI, and Remotion.

## Documentation Structure

```
docs/
├── index.md                           # Navigation index
├── README.md                          # This file
├── architecture/
│   ├── overview.md                    # System architecture overview
│   ├── projects.md                    # Project entity and workflow
│   ├── hierarchical-context.md        # 3-level context hierarchy
│   ├── state-machine.md               # Video state machine
│   └── error-handling.md              # Error handling strategy
├── integrations/
│   ├── opencode.md                    # OpenCode/ACP integration
│   ├── opencode-advanced.md           # Model selection & control
│   ├── minimax.md                     # MiniMax Hailuo AI API
│   ├── minimax-advanced.md            # Granular generation control
│   ├── remotion.md                    # Remotion video composition
│   └── remotion-code-generation.md    # Agent-generated code editing
├── code-snippets/
│   ├── opencode-bridge.md             # Reusable code snippets
│   └── remotion-hot-reload.md         # Player reload patterns
├── reference/
│   ├── acp-sdk-reference.md           # ACP SDK documentation
│   └── api-endpoints.md               # API reference
├── database/
│   └── schema.md                      # SQLite schema
├── models/
│   └── README.md                      # TypeScript models
└── configuration/
    └── schema.md                      # config.yaml schema
```

## Quick Start

### For Implementation Planning

1. **Navigation**: Start with [`index.md`](./index.md) for docs navigation
2. **Architecture**: Read [`architecture/overview.md`](./architecture/overview.md) for system understanding
3. **Projects**: Understand [`architecture/projects.md`](./architecture/projects.md) - the core organizational concept
4. **Hierarchical Context**: Learn [`architecture/hierarchical-context.md`](./architecture/hierarchical-context.md) - context merging strategy
5. **Data Model**: Check [`database/schema.md`](./database/schema.md) and [`models/README.md`](./models/README.md)
6. **State Machine**: Review [`architecture/state-machine.md`](./architecture/state-machine.md)
7. **Errors**: Understand [`architecture/error-handling.md`](./architecture/error-handling.md)
8. **Config**: See [`configuration/schema.md`](./configuration/schema.md)

### For Integration

1. **OpenCode**: Check [`integrations/opencode.md`](./integrations/opencode.md) for ACP setup
2. **OpenCode Advanced**: Model selection in [`integrations/opencode-advanced.md`](./integrations/opencode-advanced.md)
3. **MiniMax**: API specs in [`integrations/minimax.md`](./integrations/minimax.md)
4. **MiniMax Advanced**: Control APIs in [`integrations/minimax-advanced.md`](./integrations/minimax-advanced.md)
5. **Remotion**: Setup in [`integrations/remotion.md`](./integrations/remotion.md)
6. **Remotion Code Generation**: Live editing in [`integrations/remotion-code-generation.md`](./integrations/remotion-code-generation.md)
7. **Code**: Use snippets from [`code-snippets/opencode-bridge.md`](./code-snippets/opencode-bridge.md) and [`code-snippets/remotion-hot-reload.md`](./code-snippets/remotion-hot-reload.md)
8. **API**: Reference [`reference/api-endpoints.md`](./reference/api-endpoints.md) for endpoints

## Key Technologies

| Component | Technology | Purpose | Docs |
|-----------|------------|---------|------|
| Frontend | React + TypeScript | Web UI | [Models](./models/README.md) |
| API | Express + Node.js | Backend | [API Ref](./reference/api-endpoints.md) |
| AI Agent | OpenCode (ACP) | Content generation | [Integration](./integrations/opencode.md) |
| Model Control | Claude Opus/Sonnet/Haiku | Task-specific models | [Advanced](./integrations/opencode-advanced.md) |
| Video Gen | MiniMax Hailuo AI | Text-to-video | [Integration](./integrations/minimax.md) |
| Gen Control | Cancel/Regenerate/Pause | Granular control | [Advanced](./integrations/minimax-advanced.md) |
| Composition | Remotion | Video editing | [Integration](./integrations/remotion.md) |
| Live Editing | Agent-generated code | Hot-reload preview | [Code Gen](./integrations/remotion-code-generation.md) |
| Context | Hierarchical (3 levels) | Project→Video→Scene | [Context](./architecture/hierarchical-context.md) |
| Database | SQLite | Metadata storage | [Schema](./database/schema.md) |
| Config | YAML | Path configuration | [Schema](./configuration/schema.md) |

## Artifacts

Interactive HTML documentation is available in `artifacts/`:

- `video-pipeline-system/` - System architecture visualization
- `opencode-integration/` - OpenCode integration options
- `opencode-event-stream/` - Event streaming architecture

Open any `index.html` in a browser to view.

## Configuration

Create `config.yaml` in project root:

```yaml
opencode:
  mode: 'acp'
  timeout: 180000

context:
  paths:
    promo-mayo: './content/promo-mayo'
    testimonials: './content/testimonials'

minimax:
  defaultDuration: 6
  defaultResolution: '1080p'
```

## Environment Variables

```bash
# Required
MINIMAX_API_KEY="your-minimax-key"
OPENCODE_API_KEY="your-opencode-key"

# Optional
PORT=3000
REMotion_PORT=3001
DATABASE_URL="./data/videos.db"
```

## Development Workflow

1. **Create a Project** - Define name, description, and contextPath
2. **Add Content** - Place markdown/images in the project's context folder
3. **Create Videos** - Select project and submit prompt in Web UI
4. **Generate Idea** - AI creates video concept with scenes
5. **Live Edit** - Agent generates Remotion code, preview updates in real-time
6. **Iterate** - Prompt changes → code updates → hot-reload preview
7. **Generate Clips** - MiniMax creates video for each scene
8. **Monitor** - Watch progress via SSE events with granular control
9. **Compose** - Remotion stitches clips with overlays
10. **Export** - Download final video

## Advanced Capabilities

### 1. Hierarchical Context System
- Project-level context (brand, templates)
- Video-level context (theme, audience)
- Scene-level context (action, emotion)
- Automatic merging for OpenCode prompts

### 2. Model Selection
Different models for different tasks:
- **Claude Opus 4.6** - Creative idea generation
- **Claude Sonnet 4.6** - Code generation (balanced)
- **Claude Haiku 4.5** - Quick edits (fast)

### 3. Live Code Editing
- Agent generates React/Remotion code per scene
- SSE notifies UI of code changes
- Player hot-reloads automatically
- Iterate without generating clips

### 4. Granular Video Control
- Cancel in-progress generations
- Regenerate individual scenes
- Pause/resume batch generation
- Staggered generation strategy
