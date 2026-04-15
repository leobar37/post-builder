# Video Pipeline Core - Requirements

## Objective

Construir el núcleo del Video Pipeline System que proporcione infraestructura, SDKs, gestión de sesiones y utilidades para controlar OpenCode AI y coordinar la generación de videos.

## Scope

- **In scope**:
  - Core infrastructure (config, logger, errors, validation)
  - OpenCode SDK con soporte ACP
  - Session Manager con health checks
  - Event Bus pub/sub
  - Estructura de eventos tipada
  - Adaptadores para OpenCode, FFmpeg
  - Utilidades diversas
  - Estructura de carpetas
  - Base para planificación de escenas
  
- **Out of scope**:
  - Frontend UI components
  - API business routes
  - Database migrations
  - Remotion compositions específicas

## Functional Requirements

- `FR-001` - Configuración centralizada con validación de tipos
- `FR-002` - Logger estructurado con niveles (debug, info, warn, error)
- `FR-003` - Sistema de errores personalizado con códigos y contexto
- `FR-004` - SDK OpenCode que soporte modo ACP (JSON-RPC over stdio)
- `FR-005` - Session Manager que gestione sesiones ACP con metadatos
- `FR-006` - Health checks periódicos de sesiones OpenCode
- `FR-007` - Reconnexión automática de sesiones caídas
- `FR-008` - Event Bus pub/sub en memoria con tipos fuertes
- `FR-009` - Estructura de eventos estandarizada (metadata, payload, timestamp)
- `FR-010` - Adaptador OpenCode que abstraiga el protocolo ACP
- `FR-011` - Wrapper FFmpeg para operaciones comunes de video
- `FR-012` - Utilidades para validación de datos (Zod)
- `FR-013` - Utilidades para manejo de archivos y paths
- `FR-014` - Base para planificación de escenas con contexto jerárquico
- `FR-015` - Estructura de carpetas organizada por features

## Non-Functional Requirements

- `NFR-001` - TypeScript con tipado estricto (strict: true)
- `NFR-002` - Cobertura de tipos 100% en el core
- `NFR-003` - Manejo graceful de errores sin crashear el proceso
- `NFR-004` - Logs estructurados en JSON para producción
- `NFR-005` - Documentación JSDoc en APIs públicas
- `NFR-006` - Tests unitarios para utilidades críticas

## Acceptance Criteria

- [ ] Se puede importar y usar el SDK de OpenCode desde cualquier archivo
- [ ] Las sesiones se crean, monitorean y cierran correctamente
- [ ] El Event Bus permite suscribirse y emitir eventos tipados
- [ ] FFmpeg wrapper puede concatenar videos y extraer metadata
- [ ] La estructura de carpetas es clara y escalable
- [ ] Todos los módulos tienen tipos TypeScript exportados
- [ ] El código pasa typecheck sin errores

## Constraints

- Node.js 20+ con ES modules
- TypeScript 5.3+
- SQLite ya está configurado (better-sqlite3)
- MiniMax service ya existe
- Express API ya existe

## Open Questions

- ¿Se necesita persistencia de eventos o solo en memoria?
- ¿Cuál es el timeout máximo para sesiones OpenCode?
- ¿Se necesita soporte para múltiples instancias de OpenCode simultáneas?
