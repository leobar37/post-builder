/**
 * Log levels in order of severity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: { message: string; stack?: string };
}

/**
 * Logger options
 */
export interface LoggerOptions {
  level?: LogLevel;
  json?: boolean;
  prefix?: string;
}

/**
 * Structured logger with support for JSON output in production
 */
export class Logger {
  private level: LogLevel;
  private json: boolean;
  private prefix: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || this.detectLevel();
    this.json = options.json ?? process.env.NODE_ENV === 'production';
    this.prefix = options.prefix || '';
  }

  private detectLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL as LogLevel;
    if (envLevel && envLevel in LOG_LEVELS) {
      return envLevel;
    }
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): string {
    const entry: LogEntry = {
      level,
      message: this.prefix ? `[${this.prefix}] ${message}` : message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? { message: error.message, stack: error.stack } : undefined,
    };

    if (this.json) {
      return JSON.stringify(entry);
    }

    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';

    let output = `${entry.timestamp} ${levelColors[level]}[${level.toUpperCase()}]${reset} ${entry.message}`;
    
    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`;
    }
    
    if (error) {
      output += `\n${error.stack || error.message}`;
    }

    return output;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formatted = this.formatMessage(level, message, context, error);

    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  /**
   * Create a child logger with a prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      level: this.level,
      json: this.json,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
    });
  }
}

// Singleton instance for global use
let globalLogger: Logger | null = null;

/**
 * Get the global logger instance
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

/**
 * Set the global logger instance
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}
