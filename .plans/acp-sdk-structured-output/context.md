# ACP SDK + Structured Output - Context

## Overview

Este plan define la migración del SDK custom de OpenCode al SDK oficial del protocolo ACP (`@agentclientprotocol/sdk`), junto con la implementación de structured output (JSON schema) para respuestas tipadas.

## Background

**Implementación actual:**
- `AcpClient` custom que implementa JSON-RPC over stdio manualmente
- Protocolo ACP manejado a bajo nivel (spawn, stdin/stdout parsing)
- Sin soporte para structured output

**Limitaciones:**
- Mantenimiento del protocolo ACP es responsabilidad nuestra
- Sin validación de tipos en respuestas
- No aprovechamos librerías estándar

## Goal

1. **Migrar a SDK ACP oficial**: Reemplazar `AcpClient` custom con `@agentclientprotocol/sdk`
2. **Agregar structured output**: Soporte para JSON schema en prompts
3. **Mantener compatibilidad**: La interfaz `OpenCodeSDK` debe seguir funcionando igual

## Key Decisions

- **SDK ACP**: `@agentclientprotocol/sdk` - implementación oficial del protocolo
- **Validación JSON**: `zod` (ya está en dependencias)
- **Retry logic**: 2 intentos por defecto para structured output
- **Backward compat**: Mantener API existente, extender con métodos nuevos

## Scope Boundaries

- **In scope**:
  - Instalar y configurar `@agentclientprotocol/sdk`
  - Refactorizar `acp-client.ts` para usar SDK oficial
  - Agregar tipos para structured output
  - Implementar `sendPromptStructured()`
  - Validación de respuestas JSON
  
- **Out of scope**:
  - Cambios a UI/frontend
  - Nuevos endpoints API
  - Modificar `ModelRegistry` (ya funciona bien)
