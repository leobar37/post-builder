import { getLogger } from '../logger.js';
import { SessionStore, getSessionStore } from './store.js';
import type { Session } from './types.js';

/**
 * Health checker for monitoring session processes
 */
export class HealthChecker {
  private logger = getLogger().child('HealthChecker');
  private checkInterval?: NodeJS.Timeout;

  constructor(
    private store: SessionStore,
    private options: {
      intervalMs?: number;
      onUnhealthy?: (session: Session) => void;
    } = {}
  ) {}

  /**
   * Check if a session process is healthy
   */
  isHealthy(session: Session): boolean {
    if (!session.pid) {
      return false;
    }

    try {
      // Check if process exists (doesn't actually kill it)
      process.kill(session.pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check all active sessions
   */
  checkAll(): Session[] {
    const unhealthy: Session[] = [];
    const activeSessions = this.store.getByStatus('connected');

    for (const session of activeSessions) {
      if (!this.isHealthy(session)) {
        this.logger.warn(`Session ${session.id} is unhealthy`);
        unhealthy.push(session);
        
        if (this.options.onUnhealthy) {
          this.options.onUnhealthy(session);
        }
      }
    }

    return unhealthy;
  }

  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.checkInterval) return;

    const interval = this.options.intervalMs || 30000; // 30 seconds
    
    this.checkInterval = setInterval(() => {
      this.checkAll();
    }, interval);

    this.logger.info(`Health checker started (${interval}ms interval)`);
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      this.logger.info('Health checker stopped');
    }
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return !!this.checkInterval;
  }
}

// Factory function
export function createHealthChecker(
  store?: SessionStore,
  options?: ConstructorParameters<typeof HealthChecker>[1]
): HealthChecker {
  return new HealthChecker(store || getSessionStore(), options);
}
