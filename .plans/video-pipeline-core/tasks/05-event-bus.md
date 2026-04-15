# T-005 Event Bus

## Objective

Crear el Event Bus pub/sub en memoria con tipos fuertes y estructura de eventos estandarizada.

## Requirements Covered

- `FR-008` - Event Bus pub/sub en memoria
- `FR-009` - Estructura de eventos estandarizada

## Dependencies

- `T-001` - Core infrastructure (usa logger)

## Files or Areas Involved

- `src/core/events/types.ts` - Create - Tipos de eventos base
- `src/core/events/bus.ts` - Create - EventBus class
- `src/core/events/events.ts` - Create - Eventos del dominio
- `src/core/events/index.ts` - Create - Exports

## Actions

1. Definir interface base `Event` con: type, payload, metadata, timestamp
2. Definir tipos para metadata: `EventMetadata` con source, correlationId
3. Crear type `EventHandler<T>` para handlers tipados
4. Crear clase `EventBus` con métodos: `on()`, `off()`, `emit()`
5. Implementar patrón pub/sub con Map de handlers
6. Definir eventos del dominio:
   - `VideoCreated`, `VideoUpdated`, `VideoCompleted`
   - `SceneGenerated`, `SceneFailed`
   - `SessionCreated`, `SessionClosed`
   - `IdeaGenerated`, `ClipGenerated`
7. Crear helpers type-safe para emitir eventos específicos
8. Integrar con logger para tracing de eventos

## Completion Criteria

- [ ] EventBus permite suscribirse a eventos
- [ ] Eventos se emiten y llegan a los suscriptores
- [ ] Handlers pueden desuscribirse
- [ ] Tipos son fuertes (TypeScript infiere payload)
- [ ] Metadata incluye timestamp y source

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Manejar errores en handlers (no dejar crashear el bus)
- Considerar async handlers
- El bus es singleton (compartido en toda la app)
- Para escala futura, considerar persistencia o Redis
