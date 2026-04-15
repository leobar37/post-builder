# T-001 Create AgentFactory

## Objective

Crear AgentFactory que匪create el agente apropiado según sceneType.

## Requirements Covered

- `FR-001` - AgentFactory crea el agente correcto según sceneType de la sesión

## Dependencies

- none

## Files or Areas Involved

- `api/agent/AgentFactory.ts` - **Create** - Factory principal con registry de agentes
- `api/agent/core/Agent.ts` - **Read** - Base class para entender interface
- `api/agent/video-editor/VideoEditorAgent.ts` - **Read** - Referencia para implementación de agentes

## Actions

1. Crear `api/agent/AgentFactory.ts`
2. Definir `AgentType = 'hook' | 'stats' | 'cta' | 'transition'`
3. Crear registry map: `Map<AgentType, new (config) => Agent>`
4. Implementar `createAgent(sceneType, config): Agent`
5. Implementar `getAvailableAgents(): AgentType[]`
6. Exportar singleton instance

## Completion Criteria

- AgentFactory.createAgent('hook') returns HookAgent (stub initially)
- AgentFactory.createAgent('stats') returns StatsAgent (stub initially)
- SceneType desconocido lanza error con AgentType vÃ¡lido

## Validation

- TypeScript compile sin errores
- Test manual: importar AgentFactory y verificar creation de agentes

## Risks or Notes

- Los agentes reales (HookAgent, etc.) se implementan en T-002, por ahora usar stubs
