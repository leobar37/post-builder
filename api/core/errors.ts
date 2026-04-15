/**
 * Base error class for application errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;
  public readonly isOperational: boolean;
  public readonly errorCause?: unknown;

  constructor(
    message: string,
    code: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: unknown;
      isOperational?: boolean;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = options?.context;
    this.errorCause = options?.cause;
    this.isOperational = options?.isOperational ?? true;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
      cause: this.errorCause,
    };
  }
}

/**
 * Configuration-related errors
 */
export class ConfigError extends AppError {
  constructor(message: string, options?: { context?: Record<string, unknown>; cause?: unknown }) {
    super(message, 'CONFIG_ERROR', options);
  }
}

/**
 * OpenCode/ACP-related errors
 */
export class OpenCodeError extends AppError {
  public readonly sessionId?: string;

  constructor(
    message: string,
    options?: {
      sessionId?: string;
      context?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message, 'OPENCODE_ERROR', options);
    this.sessionId = options?.sessionId;
  }
}

/**
 * Session management errors
 */
export class SessionError extends AppError {
  public readonly sessionId?: string;

  constructor(
    message: string,
    options?: {
      sessionId?: string;
      context?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message, 'SESSION_ERROR', options);
    this.sessionId = options?.sessionId;
  }
}

/**
 * Video generation errors
 */
export class VideoError extends AppError {
  public readonly videoId?: string;

  constructor(
    message: string,
    options?: {
      videoId?: string;
      context?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message, 'VIDEO_ERROR', options);
    this.videoId = options?.videoId;
  }
}

/**
 * Scene generation errors
 */
export class SceneError extends AppError {
  public readonly sceneId?: string;
  public readonly videoId?: string;

  constructor(
    message: string,
    options?: {
      sceneId?: string;
      videoId?: string;
      context?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message, 'SCENE_ERROR', options);
    this.sceneId = options?.sceneId;
    this.videoId = options?.videoId;
  }
}

/**
 * FFmpeg operation errors
 */
export class FFmpegError extends AppError {
  public readonly command?: string;

  constructor(
    message: string,
    options?: {
      command?: string;
      context?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message, 'FFMPEG_ERROR', options);
    this.command = options?.command;
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(
    message: string,
    options?: {
      field?: string;
      context?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message, 'VALIDATION_ERROR', options);
    this.field = options?.field;
  }
}

/**
 * Check if an error is an operational error (expected) or programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}
