# T-005 Update Agent Routes

## Objective

Actualizar routes de agent para usar AgentFactory y getOrCreateSession.

## Requirements Covered

- `FR-001` - Routes usan AgentFactory para seleccionar agente por session.sceneType
- `FR-010` - Tool editSceneCode disponible en todos los agentes
- `FR-006` - SessionManager.getOrCreateSession reutiliza sesión existente

## Dependencies

- T-001, T-002, T-003 (todos los agentes y SessionManager deben estar listos)

## Files or Areas Involved

- `api/routes/agent.ts` - **Modify** - Usar AgentFactory, actualizar chat endpoint
- `api/agent/index.ts` - **Modify** - Exportar AgentFactory
- `api/routes/agent-callbacks.ts` - **Read** - Ver cómo maneja callbacks

## Actions

1. Actualizar `api/agent/index.ts`:
   - Exportar `AgentFactory` singleton
   - Mantener backwards compat exportando `getVideoEditorAgent` (puede retornar null o agente genérico)
2. Actualizar `api/routes/agent.ts`:
   - Importar AgentFactory
   - En POST /api/agent/sessions: usar SessionManager.getOrCreateSession en lugar de createSession
   - En POST /api/agent/chat: usar AgentFactory.createAgent(session.metadata.sceneType) en lugar de getVideoEditorAgent
   - Eliminar import de getVideoEditorAgent
3. Verificar que callbacks (`api/routes/agent-callbacks.ts`) siguen funcionando

## Completion Criteria

- POST /api/agent/sessions con misma sceneId no crea sesión duplicada
- POST /api/agent/chat usa el agente correcto según sceneType de la sesión
- Existing sessions old format siguen funcionando

## Validation

- Probar flujo completo: crear sesión, chat, crear nueva sesión con misma sceneId
- Verificar que streaming response funciona con nuevos agentes

## Risks or Notes

- Mantener backwards compat: si session no tiene sceneType, usar HookAgent por defecto
