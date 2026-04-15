# Multi-Agent Scene Architecture Context

## Overview

Refactorizar el sistema de agentes del editor de video para soportar múltiples agentes especializados por tipo de escena (hook, stats, cta, transition), cada uno con su propia sesión独立性 y system prompts especializados. El output estándar (`SceneResponse`) se mantiene idéntico.

## Background

Actualmente existe un único `VideoEditorAgent` que varía su comportamiento mediante `sceneType` en el metadata de sesión. El usuario requiere:
1. Separar físicamente cada tipo de escena en su propio agente
2. Mantener sesiones independientes por escena
3. Compartir tools comunes (`editSceneCode`) pero con prompts especializados

## Goal

- Crear `AgentFactory` que匪create agentes por sceneType
- Crear 4 agentes especializados: `HookAgent`, `StatsAgent`, `CTAAgent`, `TransitionAgent`
- Sesiones por escena: `sessionId = {videoId}_{sceneId}`
- SessionManager soporta queries por video completo
- Schema de DB actualizado para reflejar `scene_type` y `agent_session_id` en scenes

## Key Decisions

- Factory pattern para selección de agente (no subclassing dinâmico)
- Sesión por escena (no sesión unificada por video)
- Tools compartidas via base Agent class
- DB schema: nuevo field `scene_type` en scenes, `agent_session_id` FK
- Limpiar campos legacy de Video: `opencode_session_id`, `opencode_status`

## Scope Boundaries

- In scope: AgentFactory, scene agents, SessionManager, routes, types, schema migrations
- Out of scope: Frontend changes, MiniMax integration changes, otros servicios de dominio
