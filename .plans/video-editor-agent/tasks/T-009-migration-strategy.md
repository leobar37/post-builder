# T-009: Migration Strategy Express→Hono

## Objective
Estrategia de migración gradual desde Express a Hono sin romper funcionalidad existente.

## Requirements
- FR-005: API Migration Express → Hono
- Zero downtime (o mínimo)
- Backward compatibility

## Migration Phases

### Phase 1: Parallel Running (Recommended)

Ejecutar Express y Hono en puertos diferentes durante el desarrollo.

**File: `package.json` scripts**
```json
{
  "scripts": {
    "dev:express": "tsx watch api/index.ts",
    "dev:hono": "tsx watch src/server/index.ts",
    "dev:parallel": "concurrently \"pnpm:dev:express\" \"pnpm:dev:hono\" \"pnpm:dev:app\"",
    "dev": "pnpm run dev:parallel"
  }
}
```

**Configuración de puertos:**
- Express: 3458 (existente)
- Hono: 3001 (nuevo)
- Frontend: 5173 (Vite dev server)

### Phase 2: Proxy Pattern

Usar Express como proxy a Hono para rutas ya migradas.

**File: `api/proxy.ts` (temporal)**
```typescript
import { createProxyMiddleware } from 'http-proxy-middleware';

// En Express: Proxy rutas de agent a Hono
app.use('/api/agent', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
}));
```

### Phase 3: Feature Flags

Migración gradual por rutas usando feature flags.

**File: `api/index.ts` (Express - con flags)**
```typescript
const USE_HONO_AGENT = process.env.USE_HONO_AGENT === 'true';

if (USE_HONO_AGENT) {
  // Proxy to Hono
  app.use('/api/agent', honoProxy);
} else {
  // Legacy Express routes (if any)
  // app.use('/api/agent', legacyAgentRoutes);
}
```

### Phase 4: Full Migration

Cuando todas las rutas estén migradas:

1. Mover rutas de Express a Hono
2. Actualizar entry point principal
3. Deprecar Express

**File: `src/server/hono.ts` (final)**
```typescript
// Rutas migradas de Express
import videoRoutes from './routes/videos';
import sceneRoutes from './routes/scenes';
import projectRoutes from './routes/projects';

// Hono routes
app.route('/api/videos', videoRoutes);
app.route('/api/scenes', sceneRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/agent', agentRoutes);
```

## Checklist de Migración

| Ruta | Status | Priority |
|------|--------|----------|
| `/api/agent/*` | 🆕 Nuevo (Hono) | P0 |
| `/api/videos/*` | 📋 Pendiente | P1 |
| `/api/scenes/*` | 📋 Pendiente | P1 |
| `/api/projects/*` | 📋 Pendiente | P2 |
| `/api/export/*` | 📋 Pendiente | P2 |
| `/health` | ✅ Migrado | - |

## Cambios en Configuración

### Environment Variables

```bash
# Antes (Express only)
PORT=3458

# Después (Hono + Express transition)
EXPRESS_PORT=3458
HONO_PORT=3001
USE_HONO_AGENT=true
AI_MODEL=claude-3-5-sonnet-20241022
AI_API_KEY=sk-...
```

### Frontend API Client

**Opción A: Configurable base URL**
```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Usa '/api' (Express proxy) o 'http://localhost:3001/api' (Hono directo)
```

**Opción B: Vite proxy (development)**
```typescript
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': {
        target: process.env.USE_HONO === 'true' 
          ? 'http://localhost:3001' 
          : 'http://localhost:3458',
        changeOrigin: true,
      },
    },
  },
};
```

## Testing During Migration

1. **Unit Tests**: Deben pasar para ambos servidores
2. **Integration Tests**: Correr contra Express y Hono
3. **E2E Tests**: Validar flujos completos

**Script de validación:**
```bash
#!/bin/bash
echo "Testing Express..."
PORT=3458 npm run test:api

echo "Testing Hono..."
PORT=3001 npm run test:api
```

## Rollback Plan

Si algo falla en producción:

1. Revertir `USE_HONO_AGENT=false`
2. Restart Express server
3. Las rutas vuelven a usar implementación anterior

## Deprecation Timeline

| Fecha | Milestone |
|-------|-----------|
| Semana 1-2 | Hono corriendo en paralelo |
| Semana 3-4 | Proxy Express→Hono activo |
| Semana 5-6 | Feature flag 50% traffic a Hono |
| Semana 7 | Full migration, Express deprecated |
| Semana 8 | Remover código Express |

## Verification

- [ ] Ambos servidores corren simultáneamente en dev
- [ ] Proxy funciona correctamente
- [ ] Feature flags controlan routing
- [ ] Rollback funciona sin downtime
- [ ] Tests pasan en ambos servidores
- [ ] Documentación actualizada

## Dependencies
- T-001: Bootstrap Hono API
- T-006: Agent API Routes (Hono)
- `http-proxy-middleware` (opcional, para proxy)

## Estimated Effort
6-8 hours (incluyendo testing)
