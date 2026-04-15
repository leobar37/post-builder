# T-002 Utilities

## Objective

Crear utilidades reutilizables para manejo de archivos, paths, tiempo y operaciones comunes.

## Requirements Covered

- `FR-013` - Utilidades para manejo de archivos y paths

## Dependencies

- `T-001` (usa logger y errores del core)

## Files or Areas Involved

- `src/core/utils/files.ts` - Create - Operaciones de archivo async
- `src/core/utils/paths.ts` - Create - Resolución de paths del proyecto
- `src/core/utils/time.ts` - Create - Helpers de tiempo y delays
- `src/core/utils/async.ts` - Create - Helpers async (retry, timeout)
- `src/core/utils/index.ts` - Create - Exports de utilidades

## Actions

1. Crear funciones para leer/escribir archivos JSON con tipos
2. Crear función `ensureDir()` para crear directorios recursivamente
3. Crear función `exists()` wrapper async para fs.exists
4. Crear resolvedor de paths: `resolveProjectPath()`, `resolveVideoPath()`
5. Crear helpers de tiempo: `delay()`, `formatDuration()`, `timeoutPromise()`
6. Crear helper `retry()` con backoff exponencial
7. Crear helper `withTimeout()` para envolver promesas
8. Exportar todo desde `src/core/utils/index.ts`

## Completion Criteria

- [ ] Funciones de archivo manejan errores apropiadamente
- [ ] Paths se resuelven correctamente desde cwd
- [ ] Helpers de tiempo funcionan como esperado
- [ ] Retry funciona con backoff y max attempts

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Usar `fs/promises` para operaciones async
- Manejar errores de permisos en archivos
- Los paths deben ser cross-platform (Windows/Linux/Mac)
