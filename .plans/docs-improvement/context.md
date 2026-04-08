# Contexto del Plan: Mejora de Documentación del Video Pipeline

## Objetivo

Fortalecer la documentación técnica del Video Pipeline System para soportar las funcionalidades avanzadas identificadas en el análisis: contexto jerárquico, edición interactiva de Remotion, control de modelos y gestión granular de generaciones.

## Estado Actual de la Documentación

### Estructura Existente
```
docs/
├── architecture/
│   ├── overview.md          # Vista general del sistema
│   ├── projects.md          # Concepto de proyectos (nuevo)
│   ├── state-machine.md     # Máquina de estados de videos
│   └── error-handling.md    # Estrategia de errores
├── integrations/
│   ├── opencode.md          # Integración ACP básica
│   ├── minimax.md           # Integración MiniMax básica
│   └── remotion.md          # Integración Remotion básica
├── reference/
│   ├── api-endpoints.md     # Endpoints REST
│   └── acp-sdk-reference.md # Referencia del SDK ACP
├── database/schema.md       # Esquema SQLite
├── models/README.md         # Interfaces TypeScript
└── configuration/schema.md  # Configuración YAML
```

### Fortalezas Actuales
- Arquitectura base bien documentada
- Flujo de estados del video claro
- Integración ACP con EventEmitter/SSE
- Jerarquía Project → Video → Scene establecida

### Gaps Críticos Identificados
1. **Contexto solo a nivel Project**: No hay documentación de contexto específico por video o escena
2. **Remotion es estático**: No cubre generación dinámica de código por el agente
3. **OpenCode sin control de modelo**: Falta documentación de selección de modelo y parámetros
4. **MiniMax sin control granular**: Falta documentación de cancelación, regeneración, etc.

## Alcance de Este Plan

Documentar 4 capacidades avanzadas que transforman el sistema de "generador de videos" a "editor de video asistido por IA".

## Relación con el Código

Este es un plan **solo de documentación**. No se modifica código fuente, solo se crea documentación técnica que:
- Define contratos de datos
- Especifica flujos de trabajo
- Documenta APIs propuestas
- Provee ejemplos de implementación

## Arquitectura Objetivo Documentada

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DOCUMENTADO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    contextPath     ┌─────────────────────┐    │
│  │   Project   │───────────────────▶│  Archivos físicos   │    │
│  │             │                     │  (brand, guías)     │    │
│  └─────────────┘                     └─────────────────────┘    │
│         │                                                       │
│         │ 1:N                                                   │
│         ▼                                                       │
│  ┌─────────────┐    context JSON    ┌─────────────────────┐    │
│  │    Video    │───────────────────▶│  Tema, objetivo     │    │
│  │             │                     │  estilo general     │    │
│  └─────────────┘                     └─────────────────────┘    │
│         │                                                       │
│         │ 1:N                                                   │
│         ▼                                                       │
│  ┌─────────────┐    context JSON    ┌─────────────────────┐    │
│  │    Scene    │───────────────────▶│  Acción específica  │    │
│  │             │                     │  elementos visuales │    │
│  └─────────────┘                     └─────────────────────┘    │
│         │                                                       │
│         │ OpenCode recibe MERGE de contextos                    │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              AGENTE OPCODE                              │   │
│  │  • Genera ideas (con contexto completo)                 │   │
│  │  • Genera código Remotion (edición interactiva)         │   │
│  │  • Usa modelo configurado (Claude, GPT, etc.)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              REMOTION PLAYER                            │   │
│  │  • Renderiza código generado dinámicamente              │   │
│  │  • Hot-reload en edición                                │   │
│  │  • Preview antes de generar clips                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Dependencias Entre Tareas

```
T1: Contexto Jerárquico ─────┬────▶ T2: Remotion Live Editing
        │                    │
        └────────────────────┴────▶ T3: Control de Modelos
                                   │
                                   ▼
                              T4: MiniMax Control
```

- **T1 es base** de T2 y T3 (necesitan el modelo de datos extendido)
- **T2 y T3 son independientes** entre sí
- **T4 es independiente** pero complementa el flujo

## Criterios de Éxito

Al finalizar este plan, la documentación debe permitir a un desarrollador:
1. Entender cómo extender el contexto a video y scene
2. Implementar el flujo de edición interactiva de Remotion
3. Configurar diferentes modelos y parámetros para OpenCode
4. Controlar granularmente las generaciones de MiniMax

## Notas para el Ejecutor

- Mantener consistencia con el estilo existente (español, código en inglés)
- Usar ejemplos concretos de la temática del proyecto (gimnasio/promociones)
- Incluir diagramas SVG inline cuando sean útiles
- Referenciar los archivos de documentación existentes para continuidad
