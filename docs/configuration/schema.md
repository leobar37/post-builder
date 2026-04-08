# Configuration Schema

## Overview

Sistema de configuración basado en YAML. Archivo principal: `config.yaml`.

## File Locations

| Environment | Path |
|-------------|------|
| Development | `./config.yaml` |
| Production | `/etc/video-pipeline/config.yaml` or `CONFIG_PATH` env |

## Schema

```yaml
# config.yaml

# ============================================
# OpenCode Configuration
# ============================================
opencode:
  # Mode: 'acp' | 'cli' | 'skill'
  # - acp: Agent Client Protocol (recommended)
  # - cli: One-shot execution
  # - skill: Skill + HTTP
  mode: acp

  # Global timeout for OpenCode operations (milliseconds)
  timeout: 180000  # 3 minutes

  # Number of retries for recoverable errors
  retries: 2

  # ACP-specific settings
  acp:
    # Auto-reconnect on connection failure
    reconnect: true

    # Maximum reconnection attempts
    maxReconnects: 3

    # Reconnection delay (milliseconds)
    reconnectDelay: 5000

  # CLI-specific settings
  cli:
    # Output format: 'json' | 'text'
    format: json

    # Attach to running server to avoid cold start
    attach: true
    attachPort: 4096

  # ============================================
  # MODEL CONFIGURATION (Advanced)
  # ============================================
  models:
    # Modelo por defecto para tareas generales
    default:
      provider: "anthropic"
      model: "claude-sonnet-4-6"
      temperature: 0.7
      max_tokens: 4000

    # Modelo para generación de ideas complejas
    idea_generation:
      provider: "anthropic"
      model: "claude-opus-4-6"  # Más potente para creatividad
      temperature: 0.8          # Más creativo
      max_tokens: 8000
      system_prompt: |
        Eres un experto en marketing de gimnasios y fitness.
        Genera ideas de video creativas y atractivas para Instagram Reels.

    # Modelo para generación de código Remotion
    code_generation:
      provider: "anthropic"
      model: "claude-sonnet-4-6"  # Balance velocidad/calidad
      temperature: 0.2            # Más determinístico
      max_tokens: 4000
      system_prompt: |
        Eres un experto en React y Remotion.
        Genera código TypeScript/React válido y bien estructurado.
        Sigue las mejores prácticas de componentes funcionales.

    # Modelo para ediciones rápidas
    editing:
      provider: "anthropic"
      model: "claude-haiku-4-5"   # Rápido para iteraciones
      temperature: 0.3
      max_tokens: 2000

    # Modelo económico para tareas simples
    economy:
      provider: "openai"
      model: "gpt-4o-mini"
      temperature: 0.7
      max_tokens: 2000

  # Proveedores disponibles
  providers:
    anthropic:
      api_key: "${ANTHROPIC_API_KEY}"
      base_url: "https://api.anthropic.com/v1"

    openai:
      api_key: "${OPENAI_API_KEY}"
      base_url: "https://api.openai.com/v1"

    local:
      base_url: "http://localhost:11434/v1"
      model: "llama3.1"

# ============================================
# Context Configuration (Global Defaults)
# ============================================
# NOTE: Context paths are now defined per-project in the database
# These settings are global defaults used when creating new projects

context:
  # Maximum file size to include in context (bytes)
  maxFileSize: 1048576  # 1MB

  # Allowed file extensions
  allowedExtensions:
    - .md
    - .txt
    - .json
    - .yaml
    - .jpg
    - .png

  # Default context paths (used as templates)
  # Users can create projects from these templates
  templates:
    promo-mayo:
      name: "Promoción Mayo"
      description: "Campaña de promoción de mayo"
      path: ./content/templates/promo-mayo
    testimonials:
      name: "Testimonios"
      description: "Videos de testimonios de clientes"
      path: ./content/templates/testimonials
    branding:
      name: "Branding"
      description: "Material de identidad de marca"
      path: ./content/templates/branding

# ============================================
# MiniMax Configuration
# ============================================
minimax:
  # Default video duration (6, 8, or 10 seconds)
  defaultDuration: 6

  # Default resolution
  defaultResolution: 1080p  # 720p | 1080p

  # Default aspect ratio
  defaultAspectRatio: 9:16  # 16:9 | 9:16 (Reels)

  # Polling configuration
  polling:
    # Interval between status checks (milliseconds)
    interval: 5000  # 5 seconds

    # Maximum polling attempts
    maxAttempts: 60  # 5 minutes total

    # Timeout for individual requests
    requestTimeout: 10000

  # Retry configuration
  retry:
    # Maximum retries per scene
    maxRetries: 3

    # Base delay between retries (milliseconds)
    baseDelay: 5000

    # Exponential backoff multiplier
    backoffMultiplier: 2

  # Rate limiting (matches MiniMax API limits)
  rateLimit:
    # Requests per minute
    requestsPerMinute: 60

    # Concurrent tasks
    maxConcurrent: 10

# ============================================
# Remotion Configuration
# ============================================
remotion:
  # Player settings
  player:
    fps: 30
    width: 1080
    height: 1920  # 9:16 for Reels

  # Rendering settings
  render:
    # Output codec
    codec: h264  # h264 | h265 | vp8 | vp9

    # Image format for frames
    imageFormat: jpeg  # jpeg | png

    # JPEG quality (0-100)
    jpegQuality: 80

    # Pixel format
    pixelFormat: yuv420p

    # Overwrite existing files
    overwrite: true

  # Preview server
  preview:
    port: 3001
    host: localhost

# ============================================
# Database Configuration
# ============================================
database:
  # SQLite database path
  path: ./data/videos.db

  # Enable WAL mode for better concurrency
  wal: true

  # Busy timeout (milliseconds)
  busyTimeout: 5000

  # Migration settings
  migrations:
    # Auto-run migrations on startup
    autoRun: true

    # Migrations directory
    directory: ./migrations

# ============================================
# Storage Configuration
# ============================================
storage:
  # Base path for all storage
  basePath: ./storage

  # Subdirectories
  videos: videos       # Final rendered videos
  clips: clips         # MiniMax generated clips
  temp: temp           # Temporary files
  logs: logs           # Application logs

  # Retention policy
  retention:
    # Keep temp files for (hours)
    tempHours: 24

    # Keep completed videos for (days), 0 = forever
    videoDays: 30

    # Keep logs for (days)
    logDays: 7

# ============================================
# API Server Configuration
# ============================================
server:
  # HTTP port
  port: 3000

  # Host to bind
  host: 0.0.0.0

  # CORS settings
  cors:
    enabled: true
    origins:
      - http://localhost:5173
      - http://localhost:3000

  # Request limits
  limits:
    # Max request body size (bytes)
    bodySize: 10485760  # 10MB

    # Max JSON payload size
    jsonSize: 1048576   # 1MB

  # Timeout settings (milliseconds)
  timeouts:
    keepAlive: 5000
    headers: 60000
    request: 300000  # 5 minutes

# ============================================
# Logging Configuration
# ============================================
logging:
  # Log level: 'debug' | 'info' | 'warn' | 'error'
  level: info

  # Output format: 'json' | 'pretty'
  format: pretty

  # Outputs
  outputs:
    # Console output
    console:
      enabled: true

    # File output
    file:
      enabled: true
      path: ./logs/app.log
      rotation: daily  # hourly | daily | weekly

  # Redact sensitive fields
  redact:
    - api_key
    - password
    - token

# ============================================
# Security Configuration
# ============================================
security:
  # API key validation (for internal endpoints)
  apiKey:
    enabled: true
    header: X-API-Key

  # Rate limiting
  rateLimit:
    enabled: true
    # Requests per minute per IP
    requestsPerMinute: 60
    # Burst allowance
    burst: 10

  # Upload restrictions
  upload:
    maxSize: 52428800  # 50MB
    allowedTypes:
      - video/mp4
      - image/jpeg
      - image/png

# ============================================
# Feature Flags
# ============================================
features:
  # Enable OpenCode streaming via SSE
  sseStreaming: true

  # Enable video preview
  videoPreview: true

  # Enable auto-approval of ideas
  autoApproveIdeas: false

  # Enable parallel scene generation
  parallelScenes: true
  maxParallelScenes: 3

  # Enable scene retry on failure
  sceneRetry: true

  # Enable email notifications
  notifications: false
```

## Environment Variables

Variables que sobreescriben config.yaml:

| Variable | Config Path | Description |
|----------|-------------|-------------|
| `CONFIG_PATH` | - | Path to config file |
| `PORT` | `server.port` | API server port |
| `NODE_ENV` | - | development / production |
| `MINIMAX_API_KEY` | - | MiniMax API key |
| `OPENCODE_API_KEY` | - | OpenCode API key |
| `DATABASE_PATH` | `database.path` | SQLite database path |
| `STORAGE_BASE_PATH` | `storage.basePath` | Storage directory |
| `LOG_LEVEL` | `logging.level` | Log level |

## TypeScript Interface

```typescript
// config/types.ts

export interface AppConfig {
  opencode: OpenCodeConfig;
  context: ContextConfig;
  minimax: MiniMaxConfig;
  remotion: RemotionConfig;
  database: DatabaseConfig;
  storage: StorageConfig;
  server: ServerConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  features: FeatureFlags;
}

// Configuración de un modelo específico
export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'local';
  model: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  system_prompt?: string;
  tools?: string[];  // Herramientas disponibles para este modelo
}

// Configuración completa de modelos
export interface OpenCodeModelsConfig {
  default: ModelConfig;
  idea_generation: ModelConfig;
  code_generation: ModelConfig;
  editing: ModelConfig;
  economy?: ModelConfig;
  custom?: Record<string, ModelConfig>;
}

// Proveedor de modelo
export interface ModelProvider {
  api_key?: string;
  base_url: string;
  default_model?: string;
}

export interface OpenCodeConfig {
  mode: 'acp' | 'cli' | 'skill';
  timeout: number;
  retries: number;
  models: OpenCodeModelsConfig;  // NUEVO
  providers?: Record<string, ModelProvider>;  // NUEVO
  acp: {
    reconnect: boolean;
    maxReconnects: number;
    reconnectDelay: number;
  };
  cli: {
    format: 'json' | 'text';
    attach: boolean;
    attachPort: number;
  };
}

export interface ContextConfig {
  paths: Record<string, string>;
  maxFileSize: number;
  allowedExtensions: string[];
}

export interface MiniMaxConfig {
  defaultDuration: 6 | 8 | 10;
  defaultResolution: '720p' | '1080p';
  defaultAspectRatio: '16:9' | '9:16';
  polling: {
    interval: number;
    maxAttempts: number;
    requestTimeout: number;
  };
  retry: {
    maxRetries: number;
    baseDelay: number;
    backoffMultiplier: number;
  };
  rateLimit: {
    requestsPerMinute: number;
    maxConcurrent: number;
  };
}

export interface RemotionConfig {
  player: {
    fps: number;
    width: number;
    height: number;
  };
  render: {
    codec: 'h264' | 'h265' | 'vp8' | 'vp9';
    imageFormat: 'jpeg' | 'png';
    jpegQuality: number;
    pixelFormat: string;
    overwrite: boolean;
  };
  preview: {
    port: number;
    host: string;
  };
}

export interface DatabaseConfig {
  path: string;
  wal: boolean;
  busyTimeout: number;
  migrations: {
    autoRun: boolean;
    directory: string;
  };
}

export interface StorageConfig {
  basePath: string;
  videos: string;
  clips: string;
  temp: string;
  logs: string;
  retention: {
    tempHours: number;
    videoDays: number;
    logDays: number;
  };
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    enabled: boolean;
    origins: string[];
  };
  limits: {
    bodySize: number;
    jsonSize: number;
  };
  timeouts: {
    keepAlive: number;
    headers: number;
    request: number;
  };
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'pretty';
  outputs: {
    console: { enabled: boolean };
    file: {
      enabled: boolean;
      path: string;
      rotation: 'hourly' | 'daily' | 'weekly';
    };
  };
  redact: string[];
}

export interface SecurityConfig {
  apiKey: {
    enabled: boolean;
    header: string;
  };
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    burst: number;
  };
  upload: {
    maxSize: number;
    allowedTypes: string[];
  };
}

export interface FeatureFlags {
  sseStreaming: boolean;
  videoPreview: boolean;
  autoApproveIdeas: boolean;
  parallelScenes: boolean;
  maxParallelScenes: number;
  sceneRetry: boolean;
  notifications: boolean;
}
```

## Validation

```typescript
// config/validation.ts
import { z } from 'zod';
import { parse } from 'yaml';
import { readFileSync } from 'fs';

const configSchema = z.object({
  opencode: z.object({
    mode: z.enum(['acp', 'cli', 'skill']),
    timeout: z.number().min(1000).max(600000),
    retries: z.number().min(0).max(10),
    acp: z.object({
      reconnect: z.boolean(),
      maxReconnects: z.number().min(0).max(10),
      reconnectDelay: z.number().min(1000),
    }),
    cli: z.object({
      format: z.enum(['json', 'text']),
      attach: z.boolean(),
      attachPort: z.number().min(1).max(65535),
    }),
  }),

  context: z.object({
    paths: z.record(z.string()),
    maxFileSize: z.number().min(1024).max(104857600),
    allowedExtensions: z.array(z.string().startsWith('.')).min(1),
  }),

  minimax: z.object({
    defaultDuration: z.union([z.literal(6), z.literal(8), z.literal(10)]),
    defaultResolution: z.enum(['720p', '1080p']),
    defaultAspectRatio: z.enum(['16:9', '9:16']),
    polling: z.object({
      interval: z.number().min(1000).max(60000),
      maxAttempts: z.number().min(1).max(360),
      requestTimeout: z.number().min(1000).max(60000),
    }),
    retry: z.object({
      maxRetries: z.number().min(0).max(10),
      baseDelay: z.number().min(1000),
      backoffMultiplier: z.number().min(1).max(10),
    }),
    rateLimit: z.object({
      requestsPerMinute: z.number().min(1).max(1000),
      maxConcurrent: z.number().min(1).max(100),
    }),
  }),

  // ... rest of schema
});

export function loadConfig(path: string): AppConfig {
  const content = readFileSync(path, 'utf8');
  const parsed = parse(content);
  return configSchema.parse(parsed);
}
```
