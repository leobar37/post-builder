import type { Session, SessionMetadata } from './types.js';

/**
 * In-memory session store
 * 
 * Note: For production, consider persisting to database
 */
export class SessionStore {
  private sessions = new Map<string, Session>();

  /**
   * Store a session
   */
  set(session: Session): void {
    this.sessions.set(session.id, session);
  }

  /**
   * Get a session by ID
   */
  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Remove a session
   */
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions
   */
  getAll(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get sessions by status
   */
  getByStatus(status: Session['status']): Session[] {
    return this.getAll().filter(s => s.status === status);
  }

  /**
   * Get sessions by video ID
   */
  getByVideoId(videoId: string): Session[] {
    return this.getAll().filter(s => s.metadata.videoId === videoId);
  }

  /**
   * Check if session exists
   */
  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get session count
   */
  count(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * Update session status
   */
  updateStatus(sessionId: string, status: Session['status'], errorMessage?: string): boolean {
    const session = this.get(sessionId);
    if (!session) return false;

    session.status = status;
    session.lastActivity = new Date();
    
    if (errorMessage) {
      session.errorMessage = errorMessage;
    }

    if (status === 'closed' || status === 'failed') {
      session.closedAt = new Date();
    }

    return true;
  }

  /**
   * Update session PID
   */
  updatePid(sessionId: string, pid: number): boolean {
    const session = this.get(sessionId);
    if (!session) return false;

    session.pid = pid;
    session.lastActivity = new Date();
    return true;
  }

  /**
   * Increment retry count
   */
  incrementRetry(sessionId: string): number {
    const session = this.get(sessionId);
    if (!session) return 0;

    session.metadata.retryCount++;
    session.lastActivity = new Date();
    return session.metadata.retryCount;
  }
}

// Singleton instance
let store: SessionStore | null = null;

export function getSessionStore(): SessionStore {
  if (!store) {
    store = new SessionStore();
  }
  return store;
}
