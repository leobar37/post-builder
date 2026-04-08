# Video Pipeline System - Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VIDEO PIPELINE SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐      HTTP/API      ┌──────────────────┐     ACP/JSON-RPC
│   React UI   │◄──────────────────►│   Express API    │◄──────────────────┐
│              │    (REST + SSE)    │                  │                     │
└──────────────┘                    │  • OpenCodeBridge│                     │
                                    │  • MiniMaxSvc    │              ┌──────┴──────┐
                                    │  • RemotionSvc   │              │  OpenCode   │
                                    │  • SQLite        │              │   Agent     │
                                    └────────┬─────────┘              └─────────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                    ┌────┴────┐        ┌────┴────┐         ┌────┴────┐
                    │ SQLite  │        │MiniMax  │         │Remotion │
                    │Metadata │        │  API    │         │Renderer │
                    └─────────┘        └─────────┘         └─────────┘
                         │                                    │
                         │                                    │
                    ┌────┴────┐                          ┌────┴────┐
                    │Filesystem│                         │ MP4/PNG │
                    │(Context) │                         │ Output  │
                    └─────────┘                          └─────────┘
```

## Core Principles

1. **Filesystem-first**: Videos se almacenan en filesystem, SQLite solo para metadata
2. **Config-driven**: Rutas de contexto definidas en `config.yaml`
3. **Web-based**: No CLI, toda interacción via web UI
4. **Event-streaming**: Comunicación real-time con OpenCode via SSE

## Data Flow

### Video Generation Pipeline

```
1. User submits prompt via Web UI
   ↓
2. API creates video record (status: 'draft')
   ↓
3. API spawns OpenCode ACP session
   ↓
4. OpenCode analyzes context → generates video idea
   ↓
5. Idea POSTed back to API → scenes created
   ↓
6. MiniMax generates clips for each scene
   ↓
7. Remotion composes final video
   ↓
8. User sees progress via SSE events
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + TypeScript | User interface |
| API | Express + Node.js | Backend services |
| AI Agent | OpenCode (via ACP) | Content generation |
| Video Gen | MiniMax Hailuo AI | Text-to-video |
| Composition | Remotion | Video editing/preview |
| Database | SQLite | Metadata storage |
| Config | YAML | Path configuration |

## Session Management

Cada interacción con OpenCode crea una sesión ACP única:

- **Session ID**: UUID v4
- **Transport**: stdio (JSON-RPC over stdin/stdout)
- **Lifetime**: Hasta que se cierra explícitamente o timeout
- **Events**: streamed via SSE al frontend
