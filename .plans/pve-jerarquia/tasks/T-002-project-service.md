# T-002 — ProjectService

## Objetivo

Crear `api/services/project.service.ts` con toda la lógica de negocio de projects. Un service solo conoce a los repositories (client.ts), no sabe de HTTP.

## Depende de

T-001 (types)

## Archivos a tocar

**Nuevo:** `api/services/project.service.ts`

## Implementación

```typescript
// api/services/project.service.ts
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { ProjectQueries } from '../db/client';
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  ProjectWithCounts,
  ProjectListResponse,
} from '../types';

export class ProjectService {
  /**
   * Crea un project + carpeta projects/{context_id}/
   * Valida que context_id no exista (UNIQUE constraint)
   */
  create(data: CreateProjectRequest): ProjectResponse {
    // 1. Validar que no exista context_id duplicado
    const existing = ProjectQueries.getAll().find(p => p.context_id === data.context_id);
    if (existing) {
      throw new Error(`Project with context_id "${data.context_id}" already exists`);
    }

    // 2. Crear en DB
    const project = ProjectQueries.create({
      name: data.name,
      description: data.description,
      context_id: data.context_id,
      config: data.config,
    });

    // 3. Crear carpeta de contexto
    const contextPath = join(process.cwd(), 'projects', data.context_id);
    if (!existsSync(contextPath)) {
      mkdirSync(contextPath, { recursive: true });
    }

    // 4. Crear system.md base si no existe
    const systemPath = join(contextPath, 'system.md');
    if (!existsSync(systemPath)) {
      // Contenido base default
    }

    return project;
  }

  getById(id: string): ProjectResponse {
    const project = ProjectQueries.getById(id);
    if (!project) throw new Error('Project not found');
    return project;
  }

  getAll(status?: 'active' | 'archived' | 'deleted'): ProjectListResponse {
    const projects = ProjectQueries.withVideoCount(status);
    return { projects, total: projects.length };
  }

  update(id: string, data: UpdateProjectRequest): ProjectResponse {
    const existing = ProjectQueries.getById(id);
    if (!existing) throw new Error('Project not found');
    if (data.context_id && data.context_id !== existing.context_id) {
      throw new Error('context_id cannot be changed');
    }
    return ProjectQueries.update(id, data);
  }

  delete(id: string): void {
    const existing = ProjectQueries.getById(id);
    if (!existing) throw new Error('Project not found');
    ProjectQueries.delete(id);
  }
}

// Singleton
let instance: ProjectService | null = null;
export function getProjectService(): ProjectService {
  if (!instance) instance = new ProjectService();
  return instance;
}
```

## Responsabilidades del service

1. **Validación de negocio** — no crear projects con context_id duplicado
2. **Efectos secundarios** — crear carpeta en filesystem
3. **Delegación a repository** — solo ProjectQueries, no SQL inline
4. **Excepciones tipadas** — lanzar `Error` con mensaje claro, no saber de HTTP

## Notas

- La carpeta se crea dentro de `projects/{context_id}/` según la convención de docs
- No re-tirar errores de DB como errores de negocio
- El service no retorna HTTP responses, retorna datos puros

## Validación

- `tsc --noEmit` pasa en `api/services/project.service.ts`
- Los methods lanzan errores con mensajes claros (no retorna null sin throw)
