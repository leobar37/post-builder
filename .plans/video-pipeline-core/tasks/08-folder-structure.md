# T-008 Folder Structure

## Objective

Establecer la estructura de carpetas del proyecto para organizar el código de manera escalable y mantenible.

## Requirements Covered

- `FR-015` - Estructura de carpetas organizada

## Dependencies

- none (debe hacerse primero)

## Files or Areas Involved

- `src/core/` - Create - Núcleo del sistema
- `src/core/opencode/` - Create - SDK y adaptadores OpenCode
- `src/core/sessions/` - Create - Gestión de sesiones
- `src/core/events/` - Create - Event Bus
- `src/core/ffmpeg/` - Create - Wrapper FFmpeg
- `src/core/planning/` - Create - Planificación de escenas
- `src/core/utils/` - Create - Utilidades
- `src/services/` - Modify/Create - Servicios de negocio
- `src/types/` - Create - Tipos globales

## Actions

1. Crear estructura de directorios:
   ```
   src/
   ├── core/                    # Infraestructura base
   │   ├── config.ts
   │   ├── logger.ts
   │   ├── errors.ts
   │   ├── validation.ts
 │   ├── index.ts
   │   ├── opencode/           # SDK OpenCode
   │   │   ├── types.ts
   │   │   ├── acp-client.ts
   │   │   ├── sdk.ts
   │   │   └── index.ts
   │   ├── sessions/           # Session Manager
   │   │   ├── types.ts
   │   │   ├── manager.ts
   │   │   ├── store.ts
   │   │   ├── health.ts
   │   │   └── index.ts
   │   ├── events/             # Event Bus
   │   │   ├── types.ts
   │   │   ├── bus.ts
   │   │   ├── events.ts
   │   │   └── index.ts
   │   ├── ffmpeg/             # FFmpeg wrapper
   │   │   ├── types.ts
   │   │   ├── wrapper.ts
   │   │   ├── commands.ts
   │   │   └── index.ts
   │   ├── planning/           # Scene planning
   │   │   ├── types.ts
   │   │   ├── context.ts
   │   │   ├── scene-planner.ts
   │   │   └── index.ts
   │   └── utils/              # Utilidades
   │       ├── files.ts
   │       ├── paths.ts
   │       ├── time.ts
   │       ├── async.ts
   │       └── index.ts
   ├── services/               # Servicios de negocio
   │   ├── video-service.ts   # Mover desde api/services/
   │   ├── minimax-service.ts # Mover desde api/services/
   │   └── index.ts
   ├── types/                  # Tipos globales
   │   ├── index.ts
   │   ├── video.ts
   │   └── scene.ts
   └── index.ts               # Entry point del core
   ```
2. Crear archivos `index.ts` en cada directorio para exports limpios
3. Mover servicios existentes desde `api/services/` a `src/services/`
4. Actualizar imports en archivos existentes
5. Crear barrel exports en `src/core/index.ts`
6. Crear barrel exports en `src/index.ts`

## Completion Criteria

- [ ] Estructura de carpetas creada
- [ ] Archivos index.ts en cada directorio
- [ ] Servicios movidos a nueva ubicación
- [ ] Imports actualizados y funcionando
- [ ] Barrel exports configurados

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Esta tarea debe hacerse primero para tener dónde colocar los demás archivos
- Mover archivos existentes puede romper imports - verificar todo
- Mantener compatibilidad hacia atrás si es posible
- La estructura debe ser intuitiva para nuevos desarrolladores
