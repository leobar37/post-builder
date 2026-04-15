# T-002 Create Scene Agents

## Objective

Crear los 4 agentes especializados: HookAgent, StatsAgent, CTAAgent, TransitionAgent.

## Requirements Covered

- `FR-002` - HookAgent tiene system prompt especializado para escenas de apertura
- `FR-003` - StatsAgent tiene system prompt especializado para escenas de datos
- `FR-004` - CTAAgent tiene system prompt especializado para escenas de CTA
- `FR-005` - TransitionAgent tiene system prompt especializado para transiciones
- `FR-009` - Tool editSceneCode disponible en todos los agentes

## Dependencies

- T-001 (AgentFactory debe existir primero)

## Files or Areas Involved

- `api/agent/scenes/BaseSceneAgent.ts` - **Create** - Base class para scene agents
- `api/agent/scenes/HookAgent.ts` - **Create** - Agente para hook scenes
- `api/agent/scenes/StatsAgent.ts` - **Create** - Agente para stats scenes
- `api/agent/scenes/CTAAgent.ts` - **Create** - Agente para CTA scenes
- `api/agent/scenes/TransitionAgent.ts` - **Create** - Agente para transition scenes
- `api/agent/scenes/prompts/hook.ts` - **Create** - System prompt para hook
- `api/agent/scenes/prompts/stats.ts` - **Create** - System prompt para stats
- `api/agent/scenes/prompts/cta.ts` - **Create** - System prompt para CTA
- `api/agent/scenes/prompts/transition.ts` - **Create** - System prompt para transition
- `api/agent/scenes/tools/editSceneCode.ts` - **Create** - Shared tool (mover desde video-editor)
- `api/agent/video-editor/tools/editSceneCode.ts` - **Delete** - Remover después de mover
- `api/agent/core/Agent.ts` - **Read** - Base class

## Actions

1. Crear `api/agent/scenes/BaseSceneAgent.ts` que extiende Agent
   - Registry de tools compartido
   - Constructor acepta sceneType
2. Crear HookAgent, StatsAgent, CTAAgent, TransitionAgent que extienden BaseSceneAgent
3. Crear prompts especializados en `api/agent/scenes/prompts/`
4. Mover `editSceneCode` tool a `api/agent/scenes/tools/`
5. Registrar cada agente en AgentFactory (T-001)

## Completion Criteria

- HookAgent.buildSystemPrompt() incluye "hook" y apertura específica
- StatsAgent.buildSystemPrompt() incluye "stats" y visualización de datos
- CTAAgent.buildSystemPrompt() incluye "cta" y llamada a acción
- TransitionAgent.buildSystemPrompt() incluye "transition" y fluidez
- Todos los agentes tienen tool editSceneCode disponible

## Validation

- TypeScript compile sin errores
- Cada agente tiene su system prompt especializado verificable

## Risks or Notes

- Los prompts deben ser lo suficientemente diferentes para justificar agentes separados
- Considerar si hay tools específicas por agente que no son compartidas
