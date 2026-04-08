# Error Handling Strategy

## Overview

Estrategia de manejo de errores para el Video Pipeline System.

## Error Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR CATEGORIES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   OpenCode   │  │   MiniMax    │  │       System         │  │
│  │     ACP      │  │     API      │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  • Connection    • Rate limit     • Database errors            │
│  • Timeout       • API errors     • Filesystem errors          │
│  • Parse errors  • Content policy • Network errors             │
│  • Tool errors   • Task failure   • Process crashes            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Error Severity Levels

| Level | Description | Action | Example |
|-------|-------------|--------|---------|
| `info` | Informational | Log only | Connection established |
| `warning` | Recoverable | Retry | Rate limit hit |
| `error` | User-visible | Show error | Invalid prompt |
| `critical` | System failure | Alert | Database down |

## Layer-Specific Handling

### 1. OpenCode Layer (ACP)

```typescript
// lib/opencode-bridge.ts

interface ACPError {
  code: string;
  message: string;
  retryable: boolean;
}

const ACPErrors = {
  CONNECTION_FAILED: {
    code: 'ACP_CONN_FAILED',
    message: 'Failed to connect to OpenCode',
    retryable: true,
    maxRetries: 3,
  },
  TIMEOUT: {
    code: 'ACP_TIMEOUT',
    message: 'OpenCode session timed out',
    retryable: false,
  },
  PARSE_ERROR: {
    code: 'ACP_PARSE_ERROR',
    message: 'Failed to parse ACP message',
    retryable: false,
  },
  PROCESS_EXIT: {
    code: 'ACP_PROCESS_EXIT',
    message: 'OpenCode process exited unexpectedly',
    retryable: true,
    maxRetries: 2,
  },
};

class OpenCodeBridge {
  private retryCount = 0;

  async createSession(sessionId: string, cwd: string): Promise<void> {
    try {
      const process = spawn('opencode', ['acp'], { cwd, env: process.env });

      process.on('error', (error) => {
        this.handleError(sessionId, ACPErrors.CONNECTION_FAILED, error);
      });

      process.on('close', (code) => {
        if (code !== 0) {
          this.handleError(sessionId, ACPErrors.PROCESS_EXIT, { exitCode: code });
        }
      });

      // Timeout handler
      const timeoutId = setTimeout(() => {
        this.handleError(sessionId, ACPErrors.TIMEOUT);
      }, this.config.timeout);

    } catch (error) {
      this.handleError(sessionId, ACPErrors.CONNECTION_FAILED, error);
    }
  }

  private handleError(
    sessionId: string,
    errorDef: ACPError,
    details?: any
  ): void {
    const error: SystemError = {
      level: 'error',
      category: 'opencode',
      code: errorDef.code,
      message: errorDef.message,
      details,
      sessionId,
      timestamp: new Date(),
    };

    // Log error
    logger.error(error);

    // Emit to SSE
    this.emit('event', {
      type: 'error',
      sessionId,
      data: error,
    });

    // Retry if applicable
    if (errorDef.retryable && this.retryCount < (errorDef.maxRetries || 0)) {
      this.retryCount++;
      setTimeout(() => this.retry(sessionId), 5000 * this.retryCount);
    } else {
      // Transition video to failed state
      this.transitionToFailed(sessionId, error);
    }
  }
}
```

### 2. MiniMax Layer

```typescript
// services/minimax.service.ts

interface MiniMaxError {
  code: number;
  status_msg: string;
}

const MiniMaxErrorMap: Record<number, ErrorDefinition> = {
  [-1001]: {
    level: 'error',
    message: 'Invalid API key',
    retryable: false,
    userMessage: 'Authentication failed. Check API key.',
  },
  [-1002]: {
    level: 'warning',
    message: 'Rate limit exceeded',
    retryable: true,
    retryAfter: 60,
    userMessage: 'Rate limit hit. Retrying...',
  },
  [-2001]: {
    level: 'error',
    message: 'Invalid parameters',
    retryable: false,
    userMessage: 'Invalid video parameters.',
  },
  [-3001]: {
    level: 'error',
    message: 'Content policy violation',
    retryable: false,
    userMessage: 'Prompt violates content policy.',
  },
};

export class MiniMaxService {
  async handleError(
    sceneId: string,
    error: MiniMaxError
  ): Promise<void> {
    const errorDef = MiniMaxErrorMap[error.code] || {
      level: 'error',
      message: 'Unknown MiniMax error',
      retryable: false,
    };

    // Log
    logger[errorDef.level]({
      sceneId,
      code: error.code,
      message: error.status_msg,
    });

    // Update scene
    await db.scenes.update(sceneId, {
      minimaxStatus: 'fail',
      errorMessage: errorDef.userMessage || error.status_msg,
    });

    // Retry or fail
    if (errorDef.retryable) {
      const scene = await db.scenes.findById(sceneId);
      if (scene.retryCount < 3) {
        await this.retry(sceneId, errorDef.retryAfter);
      } else {
        await this.markPermanentFailure(sceneId);
      }
    } else {
      await this.markPermanentFailure(sceneId);
    }
  }

  private async markPermanentFailure(sceneId: string): Promise<void> {
    await db.scenes.update(sceneId, {
      minimaxStatus: 'fail',
    });

    // Check if video should fail
    const scene = await db.scenes.findById(sceneId);
    await checkVideoCompletion(scene.videoId);
  }
}
```

### 3. System Layer

```typescript
// middleware/error-handler.ts

import { Request, Response, NextFunction } from 'express';

interface SystemError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

export function errorHandler(
  error: SystemError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error({
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Determine response
  const statusCode = error.statusCode || 500;
  const response: ErrorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: isProduction
        ? 'An unexpected error occurred'
        : error.message,
      ...(isDevelopment && { stack: error.stack, details: error.details }),
    },
  };

  res.status(statusCode).json(response);
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

## Recovery Strategies

### Retry with Exponential Backoff

```typescript
// utils/retry.ts

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  shouldRetry?: (error: Error) => boolean
): Promise<T> {
  let attempt = 0;

  while (attempt < options.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      if (attempt >= options.maxRetries) {
        throw error;
      }

      if (shouldRetry && !shouldRetry(error as Error)) {
        throw error;
      }

      const delay = Math.min(
        options.baseDelay * Math.pow(options.backoffMultiplier, attempt),
        options.maxDelay
      );

      logger.warn(`Retry ${attempt}/${options.maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }

  throw new Error('Max retries exceeded');
}
```

### Circuit Breaker

```typescript
// utils/circuit-breaker.ts

enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if recovered
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private nextAttempt = Date.now();

  constructor(
    private threshold = 5,
    private timeout = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Usage
const miniMaxBreaker = new CircuitBreaker(5, 60000);

await miniMaxBreaker.execute(() =>
  minimaxService.generateVideo(scene)
);
```

## User-Facing Errors

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    action?: string;      // Suggested user action
    retryable?: boolean;  // Can user retry?
  };
}
```

### Example Errors

| Code | Message | User Action |
|------|---------|-------------|
| `INVALID_PROMPT` | Prompt is too long (max 2000 chars) | Shorten your prompt |
| `CONTENT_POLICY` | Prompt violates content policy | Revise prompt |
| `RATE_LIMIT` | Too many requests | Wait 60 seconds |
| `VIDEO_NOT_FOUND` | Video ID not found | Check video ID |
| `GENERATION_FAILED` | Video generation failed | Try again or contact support |
| `COMPOSITION_FAILED` | Could not compose video | Check clips exist |

## Monitoring & Alerting

### Error Metrics

```typescript
// metrics/error-metrics.ts

interface ErrorMetrics {
  // Counters
  totalErrors: Counter;
  errorsByCategory: Counter;
  errorsByCode: Counter;

  // Histograms
  errorRate: Histogram;
  recoveryTime: Histogram;
}

// Alert thresholds
const ALERTS = {
  opencode: {
    errorRate: 0.1,      // 10% error rate
    consecutiveErrors: 5,
  },
  minimax: {
    errorRate: 0.2,
    rateLimitHits: 10,
  },
  system: {
    diskSpace: 0.9,      // 90% full
    memoryUsage: 0.85,
  },
};
```
