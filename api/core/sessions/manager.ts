import { nanoid } from 'nanoid';
import { getLogger } from '../logger.js';
import { SessionError } from '../errors.js';
import { getEventBus } from '../events/bus.js';
import { EventTypes } from '../events/events.js';
import { OpenCodeSDK } from '../opencode/sdk.js';
import { SessionStore, getSessionStore } from './store.js';
import { HealthChecker, createHealthChecker } from './health.js';
import type { Session, SessionMetadata, SessionConfig, SessionStatus } from './types.js';

/**
 * Session Manager
 * 
 * Manages OpenCode ACP sessions with:
 * - Creation and lifecycle management
 * - Health monitoring
 * - Automatic reconnection
 * - Event emission
 */
export class SessionManager {
  private logger = getLogger().child('SessionManager');
  private store: SessionStore;
  private healthChecker: HealthChecker;
  private sdk: OpenCodeSDK;
  private reconnectingSessions = new Set<string>();

  constructor(config: SessionConfig = {}) {
    this.store = getSessionStore();
    this.healthChecker = createHealthChecker(this.store, {
      onUnhealthy: (session) => this.handleUnhealthySession(session),
    });
    this.sdk = new OpenCodeSDK();

    // Setup SDK event handlers
    this.setupSdkHandlers();
  }

  private setupSdkHandlers(): void {
    this.sdk.on('connected', (session) => {
      this.logger.info(`SDK connected: ${session.id}`);
      this.store.updateStatus(session.id, 'connected');
      this.store.updatePid(session.id, session.pid!);
      
      getEventBus().emit(
        EventTypes.SESSION_CREATED,
        { sessionId: session.id, contextId: this.store.get(session.id)?.metadata.contextId },
        'SessionManager'
      );
    });

    this.sdk.on('disconnected', ({ code }) => {
      this.logger.info(`SDK disconnected: ${code}`);
    });

    this.sdk.on('error', (error) => {
      this.logger.error('SDK error', error);
    });
  }

  /**
   * Create a new session
   */
  async create(metadata: Partial<SessionMetadata> = {}): Promise<Session> {
    const sessionId = nanoid(12);
    
    this.logger.info(`Creating session: ${sessionId}`);

    const session: Session = {
      id: sessionId,
      status: 'connecting',
      metadata: {
        retryCount: 0,
        maxRetries: metadata.maxRetries || 3,
        ...metadata,
      },
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.store.set(session);

    try {
      await this.sdk.connect(sessionId);
      return session;
    } catch (error) {
      this.store.updateStatus(sessionId, 'failed', getErrorMessage(error));
      throw new SessionError(`Failed to create session: ${error}`, { sessionId });
    }
  }

  /**
   * Get a session by ID
   */
  get(sessionId: string): Session | undefined {
    return this.store.get(sessionId);
  }

  /**
   * Close a session
   */
  async close(sessionId: string, reason: 'completed' | 'error' | 'timeout' | 'manual' = 'manual'): Promise<void> {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new SessionError('Session not found', { sessionId });
    }

    this.logger.info(`Closing session ${sessionId}: ${reason}`);

    try {
      await this.sdk.disconnect();
      this.store.updateStatus(sessionId, 'closed');
      
      getEventBus().emit(
        EventTypes.SESSION_CLOSED,
        { sessionId, reason },
        'SessionManager'
      );
    } catch (error) {
      this.logger.error(`Error closing session: ${error}`, error as Error);
      throw new SessionError(`Failed to close session: ${error}`, { sessionId });
    }
  }

  /**
   * Reconnect a failed session
   */
  async reconnect(sessionId: string): Promise<Session> {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new SessionError('Session not found', { sessionId });
    }

    if (this.reconnectingSessions.has(sessionId)) {
      throw new SessionError('Session already reconnecting', { sessionId });
    }

    const retryCount = this.store.incrementRetry(sessionId);
    
    if (retryCount > session.metadata.maxRetries) {
      this.store.updateStatus(sessionId, 'failed', 'Max retries exceeded');
      throw new SessionError('Max retries exceeded', { sessionId });
    }

    this.reconnectingSessions.add(sessionId);
    this.store.updateStatus(sessionId, 'reconnecting');

    getEventBus().emit(
      EventTypes.SESSION_FAILED,
      { sessionId, error: 'Reconnecting...', willRetry: true },
      'SessionManager'
    );

    try {
      await this.sdk.connect(sessionId);
      this.reconnectingSessions.delete(sessionId);
      return session;
    } catch (error) {
      this.reconnectingSessions.delete(sessionId);
      this.store.updateStatus(sessionId, 'failed', getErrorMessage(error));
      
      getEventBus().emit(
        EventTypes.SESSION_FAILED,
        { sessionId, error: getErrorMessage(error), willRetry: false },
        'SessionManager'
      );
      
      throw new SessionError(`Reconnection failed: ${error}`, { sessionId });
    }
  }

  /**
   * Handle unhealthy session detected by health checker
   */
  private async handleUnhealthySession(session: Session): Promise<void> {
    this.logger.warn(`Session ${session.id} is unhealthy, attempting reconnect`);
    
    try {
      await this.reconnect(session.id);
    } catch (error) {
      this.logger.error(`Failed to reconnect session ${session.id}`, error as Error);
    }
  }

  /**
   * Start health monitoring
   */
  startHealthChecks(): void {
    this.healthChecker.start();
  }

  /**
   * Stop health monitoring
   */
  stopHealthChecks(): void {
    this.healthChecker.stop();
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): Session[] {
    return this.store.getByStatus('connected');
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.store.count();
  }

  /**
   * Get the underlying SDK for advanced usage
   */
  getSDK(): OpenCodeSDK {
    return this.sdk;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// Singleton instance
let manager: SessionManager | null = null;

export function getSessionManager(config?: SessionConfig): SessionManager {
  if (!manager) {
    manager = new SessionManager(config);
  }
  return manager;
}
