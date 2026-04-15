# T-007 Scene Planning Base

## Objective

Crear la base para planificación de escenas con contexto jerárquico (Project → Video → Scene).

## Requirements Covered

- `FR-014` - Base para planificación de escenas

## Dependencies

- `T-005` - Event Bus (para notificar cambios)

## Files or Areas Involved

- `src/core/planning/types.ts` - Create - Tipos de contexto jerárquico
- `src/core/planning/context.ts` - Create - Context builder
- `src/core/planning/scene-planner.ts` - Create - ScenePlanner class
- `src/core/planning/index.ts` - Create - Exports

## Actions

1. Definir interfaces de contexto:
   - `ProjectContext` - brand, audience, guidelines
   - `VideoContext` - theme, objective, visualStyle, targetAudience
   - `SceneContext` - action, visualElements, textOverlay, emotion
2. Crear función `buildContextPrompt()` que combine los 3 niveles
3. Crear clase `ScenePlanner` para planificar escenas
4. Implementar método `planScenes(videoContext, sceneCount)`
5. Definir estructura de salida: `ScenePlan` con sequence, description, prompt
6. Integrar con Event Bus para emitir `ScenePlanned` events
7. Crear validadores para contextos usando Zod
8. Documentar convención de carpetas `projects/{contextId}/`

## Completion Criteria

- [ ] Contextos de 3 niveles se combinan correctamente
- [ ] ScenePlanner genera planes de escenas válidos
- [ ] Eventos se emiten al planificar escenas
- [ ] Validación de contextos funciona
- [ ] Documentación de uso está clara

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- El contexto del proyecto se lee del filesystem
- Contextos de video/scena se almacenan en DB (ya existe)
- La combinación debe ser predecible y reproducible
- Considerar caching de contexto de proyecto
