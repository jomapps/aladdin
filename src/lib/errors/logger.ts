/**
 * Structured Logging Utility
 * Phase 7: Production Polish
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: any
}

class Logger {
  private minLevel: LogLevel

  constructor() {
    this.minLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  private formatMessage(level: string, context: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const baseMsg = `[${timestamp}] ${level} [${context}] ${message}`

    if (data) {
      return `${baseMsg}\n${JSON.stringify(data, null, 2)}`
    }

    return baseMsg
  }

  debug(context: string, message: string, data?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    console.debug(this.formatMessage('DEBUG', context, message, data))
  }

  info(context: string, message: string, data?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    console.info(this.formatMessage('INFO', context, message, data))
  }

  warn(context: string, message: string, data?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return
    console.warn(this.formatMessage('WARN', context, message, data))
  }

  error(context: string, message: string, error?: Error | any, data?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return

    const errorData = {
      ...data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
    }

    console.error(this.formatMessage('ERROR', context, message, errorData))
  }

  /**
   * Log API request
   */
  logRequest(method: string, path: string, data?: any): void {
    this.info('API', `${method} ${path}`, data)
  }

  /**
   * Log API response
   */
  logResponse(method: string, path: string, statusCode: number, duration: number): void {
    this.info('API', `${method} ${path} - ${statusCode}`, {
      statusCode,
      duration: `${duration}ms`,
    })
  }

  /**
   * Log agent execution
   */
  logAgentExecution(
    departmentId: string,
    agentType: string,
    action: string,
    data?: any,
  ): void {
    this.info('Agent', `${departmentId}/${agentType}: ${action}`, data)
  }

  /**
   * Log cache access
   */
  logCacheAccess(operation: 'get' | 'set' | 'delete', key: string, hit?: boolean): void {
    this.debug('Cache', `${operation} ${key}`, { hit })
  }
}

// Singleton instance
const logger = new Logger()

export default logger

// Convenience functions
export const logDebug = (context: string, message: string, data?: LogContext) =>
  logger.debug(context, message, data)

export const logInfo = (context: string, message: string, data?: LogContext) =>
  logger.info(context, message, data)

export const logWarn = (context: string, message: string, data?: LogContext) =>
  logger.warn(context, message, data)

export const logError = (context: string, message: string | Error, error?: Error | any, data?: LogContext) => {
  if (message instanceof Error) {
    logger.error(context, message.message, message, error)
  } else {
    logger.error(context, message, error, data)
  }
}
