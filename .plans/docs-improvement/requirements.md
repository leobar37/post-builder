# Requisitos del Plan: Mejora de Documentación

## Requisitos Funcionales

### FR-001: Contexto Jerárquico de Tres Niveles
El sistema debe documentar la extensión del modelo de datos para soportar contexto en tres niveles:
- **Project**: Contexto base via `contextPath` (archivos físicos)
- **Video**: Contexto específico via `context` JSON (tema, objetivo, estilo)
- **Scene**: Contexto específico via `context` JSON (acción, elementos visuales)

**Criterios de aceptación**:
- Esquema SQL actualizado con columnas `context` en videos y scenes
- Interfaces TypeScript actualizadas
- Documentación de estrategia de merge de contextos

### FR-002: Merge de Contextos para OpenCode
El sistema debe documentar cómo OpenCode recibe el contexto mergeado de los tres niveles.

**Criterios de aceptación**:
- Algoritmo de merge documentado (shallow vs deep merge)
- Ejemplo completo de objeto de contexto resultante
- Documentación de prioridad de campos (scene sobrescribe video sobrescribe project)

### FR-003: Flujo de Edición Remotion Interactivo
El sistema debe documentar el flujo completo donde el agente edita código Remotion y el usuario ve cambios en tiempo real.

**Criterios de aceptación**:
- Diagrama de secuencia del flujo
- Ejemplo de prompt de usuario → código generado
- Documentación de recarga del player (HMR/re-mount)
- Estructura de archivos generados

### FR-004: Generación de Código Remotion por Agente
El sistema debe documentar cómo OpenCode genera código React/Remotion válido.

**Criterios de aceptación**:
- Prompt templates para generación de código
- Ejemplos de componentes generados (Scene.tsx, TextOverlay.tsx)
- Documentación de validación de código (imports permitidos, linter)
- Ejemplos de transformaciones (agregar título, cambiar animación, etc.)

### FR-005: Control de Modelos OpenCode
El sistema debe documentar cómo configurar y seleccionar modelos específicos para diferentes tareas.

**Criterios de aceptación**:
- Configuración YAML para múltiples modelos
- Mapeo de tareas a modelos (idea_generation, code_generation)
- Parámetros configurables (temperature, max_tokens, etc.)
- Documentación de capacidades por modelo

### FR-006: Control Granular de Generaciones MiniMax
El sistema debe documentar el control completo de las generaciones de video.

**Criterios de aceptación**:
- Endpoints para cancelar generación en curso
- Endpoints para regenerar escena individual
- Documentación de parámetros por escena (estilo, duración, calidad)
- Estados extendidos del polling

### FR-007: Separación de Prompts por Capa
El sistema debe documentar la separación clara entre prompts para contenido vs prompts para código.

**Criterios de aceptación**:
- Prompts de "idea generation" (contenido del video)
- Prompts de "code generation" (estructura Remotion)
- Prompts de "editing" (modificaciones incrementales)
- Documentación de cómo se combinan

## Requisitos No Funcionales

### NFR-001: Consistencia de Estilo
Toda nueva documentación debe mantener consistencia con la existente:
- Español para explicaciones
- Inglés para código y nombres de archivos
- Diagramas SVG inline (no Mermaid)
- Ejemplos concretos del dominio (gimnasio/promociones)

### NFR-002: Trazabilidad
Cada documento debe referenciar los archivos relacionados:
- Links a documentación existente relevante
- Referencias a archivos de código que implementan lo documentado
- Notas de versión cuando aplique

### NFR-003: Ejecutabilidad
La documentación debe ser suficiente para que un desarrollador pueda implementar la funcionalidad sin información adicional.

### NFR-004: Completitud de Contratos
Toda API documentada debe incluir:
- Request/Response format completo
- Códigos de error posibles
- Ejemplos de llamadas
- Esquemas de validación (Zod cuando aplique)

## Requisitos de Integración

### IR-001: Referencias Cruzadas
Los nuevos documentos deben enlazar con documentación existente:
- `projects.md` referencia al nuevo contexto jerárquico
- `state-machine.md` incluye estados de edición Remotion
- `api-endpoints.md` incluye nuevos endpoints

### IR-002: Índice Actualizado
El `docs/index.md` debe actualizarse para incluir los nuevos documentos.

### IR-003: README Principal
El `docs/README.md` debe reflejar las nuevas capacidades documentadas.

## Prioridad de Requisitos

| ID | Prioridad | Justificación |
|----|-----------|---------------|
| FR-001 | Alta | Base de las demás funcionalidades |
| FR-002 | Alta | Necesario para entender el flujo completo |
| FR-003 | Alta | Diferenciador clave del sistema |
| FR-004 | Alta | Implementación práctica de FR-003 |
| FR-005 | Media | Optimización de calidad |
| FR-006 | Media | Mejora UX operativa |
| FR-007 | Alta | Claridad arquitectónica |

## Métricas de Éxito

- [ ] 4 nuevos documentos creados en estructura apropiada
- [ ] 0 breaking changes en documentación existente (solo extensiones)
- [ ] 100% de requisitos FR-001 a FR-007 cubiertos
- [ ] Todos los diagramas en SVG inline
- [ ] Índices actualizados (index.md y README.md)
