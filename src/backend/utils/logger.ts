import { createLogger as createWinstonLogger, format, transports, Logger } from 'winston'; // winston 3.8.2
import * as DailyRotateFile from 'winston-daily-rotate-file'; // winston-daily-rotate-file 4.7.1
import * as morgan from 'morgan'; // morgan 1.10.0
import { v4 as uuidv4 } from 'uuid'; // uuid 9.0.0
import { AsyncLocalStorage } from 'async_hooks';

import { 
  loggerConfig, 
  httpLoggerConfig, 
  fileLoggerConfig, 
  auditLoggerConfig, 
  maskingPatterns 
} from '../config/logger.config';

// Constants
const SERVICE_NAME = process.env.SERVICE_NAME || 'hcbs-revenue-management';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize correlation ID storage
const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

/**
 * Type definitions for logger options
 */
interface LogOptions {
  correlationId?: string;
  userId?: string;
  component?: string;
  skipMasking?: boolean;
  audit?: boolean;
}

/**
 * Creates and configures the main Winston logger instance with appropriate transports
 * and formats based on the environment and configuration.
 * 
 * @returns Configured Winston logger instance
 */
const createLogger = (): Logger => {
  // Create format based on configuration
  const logFormat = loggerConfig.format === 'json'
    ? format.json()
    : format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, service, ...meta }) => {
          return `${timestamp} [${level}] ${service ? `[${service}] ` : ''}${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      );

  // Create base format with common transformations
  const baseFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    format((info) => addMetadata(info))(),
  );

  // Create logger with console transport
  const logger = createWinstonLogger({
    level: loggerConfig.logLevel,
    format: format.combine(
      baseFormat,
      logFormat
    ),
    defaultMeta: {
      service: SERVICE_NAME,
      environment: NODE_ENV
    },
    transports: [
      new transports.Console()
    ],
    exitOnError: false
  });

  // Add file transport for production and staging environments
  if (NODE_ENV !== 'development') {
    // Application logs
    const fileTransport = new DailyRotateFile({
      filename: fileLoggerConfig.filename,
      datePattern: fileLoggerConfig.datePattern,
      maxSize: fileLoggerConfig.maxSize,
      maxFiles: fileLoggerConfig.maxFiles,
      format: format.combine(
        baseFormat,
        format.json()
      )
    });
    
    logger.add(fileTransport);

    // Audit logs (separate file with extended retention)
    const auditTransport = new DailyRotateFile({
      filename: auditLoggerConfig.filename,
      datePattern: auditLoggerConfig.datePattern,
      maxFiles: auditLoggerConfig.maxFiles,
      level: 'info',
      format: format.combine(
        baseFormat,
        format.json()
      )
    });

    logger.add(auditTransport);
  }

  return logger;
};

/**
 * Creates a Morgan HTTP request logger with custom format and options
 * 
 * @returns Configured Morgan middleware function
 */
const createHttpLogger = () => {
  // Create stream that writes to our Winston logger
  const stream = {
    write: (message: string) => {
      winstonLogger.http(message.trim());
    }
  };

  // Configure Morgan with format and options
  return morgan(httpLoggerConfig.format, {
    ...httpLoggerConfig.options,
    stream,
    // Skip logging health check endpoints to reduce noise
    skip: (req) => {
      return req.url === '/health' || req.url === '/health/live' || req.url === '/health/ready';
    }
  });
};

/**
 * Generates a unique correlation ID for request tracing
 * 
 * @returns Unique correlation ID (UUID v4)
 */
const createCorrelationId = (): string => {
  return uuidv4();
};

/**
 * Gets the current correlation ID from async local storage
 * 
 * @returns Current correlation ID or undefined if not set
 */
export const getCorrelationId = (): string | undefined => {
  const store = asyncLocalStorage.getStore();
  return store?.get('correlationId');
};

/**
 * Sets a correlation ID in async local storage
 * 
 * @param correlationId - Correlation ID to set
 */
export const setCorrelationId = (correlationId: string): void => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set('correlationId', correlationId);
  }
};

/**
 * Runs a callback with a correlation ID in context
 * 
 * @param correlationId - Correlation ID to use in the context
 * @param callback - Function to execute within the correlation ID context
 */
export const runWithCorrelationId = <T>(correlationId: string, callback: () => T): T => {
  const store = new Map<string, string>();
  store.set('correlationId', correlationId);
  return asyncLocalStorage.run(store, callback);
};

/**
 * Masks sensitive information in log messages to ensure HIPAA compliance
 * 
 * @param data - Data object to mask
 * @returns Data with sensitive information masked
 */
const maskSensitiveInfo = (data: any): any => {
  // Return early if data is null, undefined, or not an object
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }

  // Create a deep copy to avoid modifying the original object
  const maskedData = Array.isArray(data) ? [...data] : { ...data };

  // Process object or array recursively
  if (Array.isArray(maskedData)) {
    return maskedData.map(item => maskSensitiveInfo(item));
  } else {
    // Process each property in the object
    for (const key in maskedData) {
      if (Object.prototype.hasOwnProperty.call(maskedData, key)) {
        const value = maskedData[key];
        
        // Recursively mask nested objects
        if (value !== null && typeof value === 'object') {
          maskedData[key] = maskSensitiveInfo(value);
        } 
        // Apply masking patterns to string values
        else if (typeof value === 'string') {
          let maskedValue = value;
          
          // Apply each masking pattern
          for (const pattern of maskingPatterns) {
            maskedValue = maskedValue.replace(pattern.regex, pattern.replacement);
          }
          
          maskedData[key] = maskedValue;
        }
      }
    }
    return maskedData;
  }
};

/**
 * Adds standard metadata to log entries including service name, environment, and correlation ID
 * 
 * @param info - Log info object
 * @returns Log info with added metadata
 */
const addMetadata = (info: any): any => {
  // Add standard metadata
  info.service = SERVICE_NAME;
  info.environment = NODE_ENV;
  info.timestamp = new Date().toISOString();

  // Add correlation ID if available
  const correlationId = getCorrelationId();
  if (correlationId) {
    info.correlationId = correlationId;
  }

  return info;
};

/**
 * Logs a message with additional context and ensures sensitive data is masked
 * 
 * @param level - Log level (error, warn, info, http, debug, verbose)
 * @param message - Log message
 * @param context - Additional context data to include in the log
 * @param options - Logging options (correlation ID, user ID, component, etc.)
 */
const logWithContext = (
  level: string, 
  message: string, 
  context: Record<string, any> = {}, 
  options: LogOptions = {}
): void => {
  try {
    // Mask sensitive data unless explicitly skipped
    const maskedContext = options.skipMasking ? context : maskSensitiveInfo(context);
    
    // Prepare log data
    const logData = {
      message,
      ...maskedContext,
      component: options.component,
      userId: options.userId,
      correlationId: options.correlationId || getCorrelationId()
    };

    // Use the audit transport for audit logs if enabled
    if (options.audit) {
      winstonLogger.log({
        level: 'info',
        ...logData,
        isAudit: true
      });
    } else {
      // Log with the specified level
      winstonLogger.log(level, logData);
    }
  } catch (error) {
    // Fallback to console in case of logging errors
    console.error('Logging error:', error);
    console.log(`Original log (${level}): ${message}`, context);
  }
};

// Create the logger instances
const winstonLogger = createLogger();
const httpLogger = createHttpLogger();

// Create the logger object to export
export const logger = {
  // Standard logging methods
  error: (message: string, context: Record<string, any> = {}, options: LogOptions = {}) => 
    logWithContext('error', message, context, options),
  
  warn: (message: string, context: Record<string, any> = {}, options: LogOptions = {}) => 
    logWithContext('warn', message, context, options),
  
  info: (message: string, context: Record<string, any> = {}, options: LogOptions = {}) => 
    logWithContext('info', message, context, options),
  
  http: (message: string, context: Record<string, any> = {}, options: LogOptions = {}) => 
    logWithContext('http', message, context, options),
  
  debug: (message: string, context: Record<string, any> = {}, options: LogOptions = {}) => 
    logWithContext('debug', message, context, options),
  
  verbose: (message: string, context: Record<string, any> = {}, options: LogOptions = {}) => 
    logWithContext('verbose', message, context, options),
  
  // Audit logging (for security and compliance)
  audit: (message: string, context: Record<string, any> = {}, options: LogOptions = {}) => 
    logWithContext('info', message, context, { ...options, audit: true }),
  
  // Request tracing
  createCorrelationId,
  
  // HTTP request logging middleware
  httpLogger,
  
  // Run in correlation ID context
  runWithCorrelationId,
};

// Export default and named exports for flexibility
export default logger;