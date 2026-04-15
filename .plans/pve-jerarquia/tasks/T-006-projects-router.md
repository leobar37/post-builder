# T-006 — ProjectsRouter

## Objetivo

Crear `api/routes/projects.ts` con CRUD completo de projects.

## Depende de

T-001 (types), T-002 (ProjectService)

## Archivos a tocar

**Nuevo:** `api/routes/projects.ts`

## Implementación

```typescript
// api/routes/projects.ts
import { Router, type Request, type Response } from 'express';
import { getProjectService } from '../services/project.service';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../types';
import { z } from 'zod';

const router = Router();
const projectService = getProjectService();

// Validation schemas
const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  context_id: z.string().min(1).max(50).regex(/^[a-z0-9-_]+$/),
  config: z.record(z.unknown()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
});

// POST /api/projects
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const project = projectService.create(parsed.data as CreateProjectRequest);
    res.status(201).json({ success: true, project });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('already exists')) {
      res.status(409).json({ success: false, error: message });
    } else {
      res.status(500).json({ success: false, error: message });
    }
  }
});

// GET /api/projects
router.get('/', (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const result = projectService.getAll(status as 'active' | 'archived' | 'deleted' | undefined);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/projects/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const project = projectService.getById(req.params.id);
    res.json(project);
  } catch (err) {
    if (err instanceof Error && err.message === 'Project not found') {
      res.status(404).json({ success: false, error: 'Project not found' });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

// PATCH /api/projects/:id
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const project = projectService.update(req.params.id, parsed.data as UpdateProjectRequest);
    res.json({ success: true, project });
  } catch (err) {
    if (err instanceof Error && err.message === 'Project not found') {
      res.status(404).json({ success: false, error: 'Project not found' });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

// DELETE /api/projects/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    projectService.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Project not found') {
      res.status(404).json({ success: false, error: 'Project not found' });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

export default router;
```

## Notas

- Usa Zod para validación de input
- Todos los errores son `{ success: false, error: string }`
- Los métodos del service lanzan excepciones, el route las captura y convierte a HTTP codes
- No llama a `VideoQueries` directo — solo usa `ProjectService`

## Validación

- `tsc --noEmit` pasa
- Todos los endpoints tienen manejo de errores
- La validación Zod devuelve 400 con mensaje descriptivo
