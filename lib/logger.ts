/**
 * Enhanced logging utility for production
 */

import { isProduction } from "./env";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    // In production, only log WARN and ERROR
    // In development, log everything
    this.minLevel = isProduction ? LogLevel.WARN : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage("DEBUG", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage("INFO", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message, context));
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      };
      console.error(this.formatMessage("ERROR", message, errorContext));

      // In production, send to error tracking service
      if (isProduction && error) {
        this.sendToErrorTracking(message, error, errorContext);
      }
    }
  }

  private sendToErrorTracking(
    _message: string,
    _error?: unknown,
    _context?: LogContext,
  ): void {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: context });
    // }
  }
}

export const logger = new Logger();
