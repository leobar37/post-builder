# T-001: Bootstrap Hono API

## Objective
Configurar Hono como framework API, instalando dependencias y creando la estructura base del servidor.

## Requirements
- FR-005: API Migration Express → Hono
- NFR-001: TypeScript strict mode

## Implementation

### 1. Instalar dependencias

```bash
pnpm add hono @hono/node-server ai @ai-sdk/anthropic @ai-sdk/openai
pnpm add -D @types/node
```

### 2. Crear estructura de carpetas

```
src/
└── server/
    ├── index.ts          # Entry point
    ├── hono.ts           # Instancia Hono
    ├── middleware/
    │   ├── cors.ts       # CORS config
    │   ├── error.ts      # Error handling
    │   └── logger.ts     # Request logging
    └── routes/
        └── index.ts      # Router aggregator
```

### 3. Implementar servidor base

**File: `src/server/hono.ts`**
```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

export const app = new Hono();

// Middlewares globales
app.use(logger());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));
```

**File: `src/server/index.ts`**
```typescript
import { serve } from '@hono/node-server';
import { app } from './hono';

const PORT = parseInt(process.env.PORT || '3001');

serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`🚀 Hono server running on port ${PORT}`);
```

### 4. Script en package.json

```json
{
  "scripts": {
    "dev:hono": "tsx watch src/server/index.ts",
    "dev:api": "concurrently \"pnpm run dev:hono\" \"pnpm run dev:express\"",
    "dev:express": "tsx watch api/index.ts"
  }
}
```

## Verification

- [ ] `pnpm run dev:hono` inicia servidor sin errores
- [ ] `GET /health` retorna `{status: "ok"}`
- [ ] CORS permite requests del frontend
- [ ] TypeScript compila sin errores (`tsc --noEmit`)

## Dependencies
- None (foundational task)

## Estimated Effort
2-3 hours
