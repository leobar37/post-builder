/**
 * Session types and interfaces
 */

export type SessionStatus = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'failed'
  | 'closed';

export interface SessionMetadata {
  contextId?: string;
  videoId?: string;
  taskType?: 'idea' | 'code' | 'edit';
  retryCount: number;
  maxRetries: number;
}

export interface Session {
  id: string;
  status: SessionStatus;
  pid?: number;
  metadata: SessionMetadata;
  createdAt: Date;
  lastActivity: Date;
  closedAt?: Date;
  errorMessage?: string;
}

export interface SessionConfig {
  maxRetries?: number;
  healthCheckInterval?: number;
  reconnectBackoff?: number;
}

export type SessionEventType = 
  | 'session:created'
  | 'session:connected'
  | 'session:closed'
  | 'session:failed'
  | 'session:reconnecting';

export interface SessionEvent {
  type: SessionEventType;
  sessionId: string;
  timestamp: Date;
  error?: string;
}
