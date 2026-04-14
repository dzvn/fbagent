import { randomUUID } from "crypto";

export interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  latency?: number;
  intent?: string | null;
  source?: string;
  [key: string]: any;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: Error): void;
  debug(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

const LOG_LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const CURRENT_LEVEL = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL as keyof typeof LOG_LEVELS] || 20 : 20;

/**
 * Simple structured logger (pino-like)
 * Outputs JSON-formatted logs for easy parsing
 */
export function createLogger(name: string, baseContext: LogContext = {}): Logger {
  function formatLog(level: string, levelNum: number, message: string, context: LogContext = {}, error?: Error) {
    if (levelNum < CURRENT_LEVEL) return;
    
    const logEntry = {
      level,
      time: Date.now(),
      timestamp: new Date().toISOString(),
      name,
      msg: message,
      ...baseContext,
      ...context,
      ...(error && {
        err: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };
    
    // Remove sensitive data
    const sanitized = sanitizeLog(logEntry);
    
    const output = JSON.stringify(sanitized);
    
    if (levelNum >= 40) {
      console.error(output);
    } else if (levelNum >= 30) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }
  
  function sanitizeLog(entry: any): any {
    const sensitive = ["apiKey", "api_key", "password", "secret", "token", "authorization"];
    const sanitized = { ...entry };
    
    for (const key of sensitive) {
      if (sanitized[key]) {
        sanitized[key] = "[REDACTED]";
      }
    }
    
    return sanitized;
  }
  
  return {
    info(message, context) {
      formatLog("info", 20, message, context || {});
    },
    warn(message, context) {
      formatLog("warn", 30, message, context || {});
    },
    error(message, context, error) {
      formatLog("error", 40, message, context || {}, error);
    },
    debug(message, context) {
      formatLog("debug", 10, message, context || {});
    },
    child(context) {
      return createLogger(name, { ...baseContext, ...context });
    }
  };
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Request logging middleware helper
 */
export function createRequestLogger(logger: Logger) {
  return {
    onRequest(requestId: string, method: string, path: string) {
      logger.debug("Request started", {
        requestId,
        method,
        path
      });
      return Date.now();
    },
    
    onResponse(startTime: number, requestId: string, method: string, path: string, status: number, context?: LogContext) {
      const latency = Date.now() - startTime;
      logger.info("Request completed", {
        requestId,
        method,
        path,
        status,
        latency,
        ...context
      });
    }
  };
}

// Default application logger
export const appLogger = createLogger("fbagent-backend");
