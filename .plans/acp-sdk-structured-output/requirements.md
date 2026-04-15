# ACP SDK + Structured Output - Requirements

## Objective

Migrar la implementación custom del protocolo ACP al SDK oficial (`@agentclientprotocol/sdk`) y agregar soporte para structured output con validación JSON schema.

## Scope

- **In scope**:
  - Instalar `@agentclientprotocol/sdk`
  - Refactorizar `acp-client.ts` para usar SDK oficial
  - Agregar tipos para structured output
  - Implementar método `sendPromptStructured()`
  - Validación de respuestas con Zod
  - Retry automático (2 intentos) para structured output
  
- **Out of scope**:
  - Cambios a UI/frontend
  - Nuevos endpoints API
  - Modificar funcionalidad de `ModelRegistry`

## Functional Requirements

- `FR-001` - Instalar `@agentclientprotocol/sdk` como dependencia
- `FR-002` - Crear `AcpClient` wrapper que use SDK oficial
- `FR-003` - Mantener compatibilidad con interfaz existente de `OpenCodeSDK`
- `FR-004` - Agregar tipos `OutputFormat`, `JsonSchema`, `StructuredPromptRequest`
- `FR-005` - Implementar `sendPromptStructured()` con soporte JSON schema
- `FR-006` - Validar respuestas JSON contra schema usando Zod
- `FR-007` - Implementar retry automático (2 intentos) si validación falla
- `FR-008` - Agregar `StructuredOutputError` para errores de validación

## Non-Functional Requirements

- `NFR-001` - TypeScript strict mode compliance
- `NFR-002` - Backward compatibility: código existente debe seguir funcionando
- `NFR-003` - Error handling: errores deben ser catchables y tener contexto
- `NFR-004` - Logging: todas las operaciones deben loguearse apropiadamente

## Acceptance Criteria

- [ ] `@agentclientprotocol/sdk` instalado y funcionando
- [ ] `acp-client.ts` usa SDK oficial en lugar de implementación custom
- [ ] `sendPrompt()` sigue funcionando igual que antes
- [ ] `sendPromptStructured()` devuelve JSON validado
- [ ] Si JSON no valida, se reintentan 2 veces antes de fallar
- [ ] Typecheck pasa sin errores
- [ ] Tests manuales pasan (conexión, prompts, structured output)

## Constraints

- Node.js 20+ con ES modules
- TypeScript 5.3+
- Mantener API existente de `OpenCodeSDK`
- Usar Zod para validación (ya está instalado)

## Open Questions

- ¿El SDK oficial ACP soporta stdio o solo HTTP/WebSocket?
- ¿Necesitamos mantener soporte para `apiKey` en config o el SDK maneja auth?
