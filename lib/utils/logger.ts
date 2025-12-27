/**
 * Centralized logging utility for consistent logging across the application.
 *
 * Usage:
 * import { logger } from '@/lib/utils/logger';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Failed to fetch data', error, { url: '/api/data' });
 * logger.warn('Rate limit approaching', { remaining: 10 });
 * logger.debug('Processing item', { itemId: '456' });
 *
 * For API routes:
 * const routeLogger = logger.withContext({ route: '/api/analysis' });
 * routeLogger.info('Request received');
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;
  private context: LogContext;
  private isDevelopment: boolean;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.minLevel = this.isDevelopment ? 'debug' : 'info';
  }

  /**
   * Create a new logger instance with additional context
   */
  withContext(additionalContext: LogContext): Logger {
    const newLogger = new Logger({ ...this.context, ...additionalContext });
    return newLogger;
  }

  /**
   * Set the minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`, entry.message];

      if (entry.context && Object.keys(entry.context).length > 0) {
        parts.push(JSON.stringify(entry.context));
      }

      if (entry.error) {
        parts.push(`\n  Error: ${entry.error.message}`);
        if (entry.error.stack) {
          parts.push(`\n  Stack: ${entry.error.stack}`);
        }
      }

      return parts.join(' ');
    }

    // JSON format for production (easier to parse in log aggregators)
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, error?: Error | null, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }

    const formatted = this.formatEntry(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  /**
   * Log a debug message (development only by default)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, null, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, null, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, null, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : null;
    this.log('error', message, err, context);
  }

  /**
   * Log the start of an operation and return a function to log its completion
   * Useful for timing async operations
   */
  time(operation: string, context?: LogContext): () => void {
    const start = Date.now();
    this.debug(`Starting: ${operation}`, context);

    return () => {
      const duration = Date.now() - start;
      this.info(`Completed: ${operation}`, { ...context, durationMs: duration });
    };
  }

  /**
   * Create a child logger for a specific API route
   */
  forRoute(routePath: string): Logger {
    return this.withContext({ route: routePath });
  }

  /**
   * Create a child logger for a specific service
   */
  forService(serviceName: string): Logger {
    return this.withContext({ service: serviceName });
  }

  /**
   * Create a child logger for a specific analysis
   */
  forAnalysis(analysisId: string): Logger {
    return this.withContext({ analysisId });
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export the class for creating new instances
export { Logger };

// Export types
export type { LogLevel, LogContext, LogEntry };
