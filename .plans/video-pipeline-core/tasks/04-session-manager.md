# T-004 Session Manager

## Objective

Implementar el Session Manager que gestione sesiones OpenCode con metadatos, health checks y reconnexión automática.

## Requirements Covered

- `FR-005` - Session Manager con metadatos
- `FR-006` - Health checks periódicos
- `FR-007` - Reconnexión automática

## Dependencies

- `T-003` - OpenCode SDK

## Files or Areas Involved

- `src/core/sessions/types.ts` - Create - Tipos de sesión y metadatos
- `src/core/sessions/manager.ts` - Create - SessionManager class
- `src/core/sessions/store.ts` - Create - Almacenamiento en memoria
- `src/core/sessions/health.ts` - Create - Health checker
- `src/core/sessions/index.ts` - Create - Exports

## Actions

1. Definir interface `Session` con: id, status, pid, createdAt, lastActivity
2. Definir interface `SessionMetadata` con context, taskType, retryCount
3. Crear clase `SessionStore` para almacenar sesiones en memoria
4. Crear clase `HealthChecker` con método `isHealthy(sessionId)`
5. Implementar polling periódico de health checks
6. Crear clase `SessionManager` principal
7. Implementar métodos: `create()`, `get()`, `close()`, `reconnect()`
8. Implementar eventos: `session:created`, `session:closed`, `session:failed`
9. Integrar con Event Bus para notificar cambios
10. Implementar reconnexión automática con backoff

## Completion Criteria

- [ ] Sesiones se crean con metadatos completos
- [ ] Health checker detecta sesiones caídas
- [ ] Reconnexión funciona tras fallo de conexión
- [ ] Eventos se emiten en cambios de estado
- [ ] Store mantiene estado consistente

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Usar `process.kill(pid, 0)` para verificar si proceso existe
- Limitar reintentos de reconexión para evitar loops infinitos
- Limpiar recursos (listeners, intervals) al cerrar sesiones
- Considerar persistir sesiones en DB para recovery
