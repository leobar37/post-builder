# T-001 Core Infrastructure

## Objective

Establecer la infraestructura base del core: configuración tipada, logger estructurado, sistema de errores y validación.

## Requirements Covered

- `FR-001` - Configuración centralizada con validación de tipos
- `FR-002` - Logger estructurado con niveles
- `FR-003` - Sistema de errores personalizado
- `FR-012` - Utilidades para validación de datos

## Dependencies

- none

## Files or Areas Involved

- `src/core/config.ts` - Create - Configuración centralizada con Zod
- `src/core/logger.ts` - Create - Logger estructurado con niveles
- `src/core/errors.ts` - Create - Clases de error personalizadas
- `src/core/validation.ts` - Create - Schemas Zod base
- `src/core/index.ts` - Create - Exports del core

## Actions

1. Crear schema Zod para configuración (database, opencode, minimax, paths)
2. Implementar función `loadConfig()` que lea variables de entorno y valide
3. Crear clase `Logger` con métodos: debug, info, warn, error
4. Soportar formato JSON en producción y pretty en desarrollo
5. Crear clase base `AppError` con código, mensaje y contexto
6. Crear errores específicos: `ConfigError`, `OpenCodeError`, `SessionError`
7. Crear schemas Zod reutilizables para validación común
8. Exportar todo desde `src/core/index.ts`

## Completion Criteria

- [ ] Configuración se carga y valida correctamente
- [ ] Logger imprime en consola con formato adecuado
- [ ] Errores pueden ser instanciados y tienen stack trace
- [ ] Validación con Zod funciona para casos comunes
- [ ] Todos los módulos exportan tipos TypeScript

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Asegurar que `loadConfig()` falle graceful si faltan variables críticas
- El logger debe ser singleton para evitar múltiples instancias
- Los errores deben ser serializables para logs JSON
