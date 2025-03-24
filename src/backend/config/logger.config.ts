import * as winston from 'winston';  // winston 3.8.2
import * as DailyRotateFile from 'winston-daily-rotate-file';  // winston-daily-rotate-file 4.7.1
import * as path from 'path';  // path ^1.8.0

// Environment and configuration variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FORMAT = process.env.LOG_FORMAT || 'json';
const LOG_DIR = process.env.LOG_DIR || 'logs';

/**
 * Determines the appropriate log level based on environment and configuration
 * @returns Log level (error, warn, info, http, verbose, debug, silly)
 */
const getLogLevel = (): string => {
  if (LOG_LEVEL) {
    return LOG_LEVEL;
  }
  
  return NODE_ENV === 'production' ? 'info' : 'debug';
};

/**
 * Determines the log format (json or simple) based on environment and configuration
 * @returns Log format (json or simple)
 */
const getLogFormat = (): string => {
  if (LOG_FORMAT) {
    return LOG_FORMAT;
  }
  
  return NODE_ENV === 'production' ? 'json' : 'simple';
};

/**
 * Configuration for the main application logger
 * Includes console and file transports with appropriate formatting
 */
export const loggerConfig = {
  logLevel: getLogLevel(),
  format: getLogFormat(),
  transports: [
    new winston.transports.Console({
      level: getLogLevel(),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        getLogFormat() === 'json'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                return `${timestamp} [${level}] ${service ? `[${service}] ` : ''}${message} ${
                  Object.keys(meta).length ? JSON.stringify(meta) : ''
                }`;
              })
            )
      ),
    }),
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: getLogLevel(),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
  ],
};

/**
 * Configuration for HTTP request logging
 * Uses Morgan format with a custom stream that writes to Winston
 */
export const httpLoggerConfig = {
  format: 'combined',
  options: {
    stream: {
      write: (message: string) => {
        winston.createLogger({
          level: 'http',
          format: winston.format.json(),
          defaultMeta: { service: 'http' },
          transports: [
            new DailyRotateFile({
              filename: path.join(LOG_DIR, 'http-%DATE%.log'),
              datePattern: 'YYYY-MM-DD',
              maxSize: '20m',
              maxFiles: '14d',
            }),
          ],
        }).info(message.trim());
      },
    },
  },
};

/**
 * Configuration for file-based logging with rotation
 * Used for general application logging
 */
export const fileLoggerConfig = {
  filename: path.join(LOG_DIR, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // Retain logs for 14 days
};

/**
 * Configuration for audit logging with extended retention
 * Required for HIPAA compliance (7 years retention)
 */
export const auditLoggerConfig = {
  filename: path.join(LOG_DIR, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '2555d', // 7 years retention for HIPAA compliance
};

/**
 * Patterns for masking sensitive data in logs (HIPAA compliance)
 * These patterns will be applied to log entries to redact PHI and PII
 */
export const maskingPatterns = [
  // Social Security Numbers (SSN)
  { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: 'XXX-XX-XXXX' },
  
  // Credit Card Numbers (various formats)
  { regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: 'XXXX-XXXX-XXXX-XXXX' },
  
  // Phone Numbers
  { regex: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: 'XXX-XXX-XXXX' },
  
  // Email Addresses
  { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: 'EMAIL@REDACTED' },
  
  // Dates of Birth (various formats)
  { regex: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, replacement: 'XX/XX/XXXX' },
  { regex: /\b\d{4}-\d{1,2}-\d{1,2}\b/g, replacement: 'XXXX-XX-XX' },
  
  // Medicaid IDs
  { regex: /\bMedicaid ID:?\s*\w+\b/gi, replacement: 'Medicaid ID: REDACTED' },
  { regex: /\bMedicaid Number:?\s*\w+\b/gi, replacement: 'Medicaid Number: REDACTED' },
  { regex: /\bMedicaid#:?\s*\w+\b/gi, replacement: 'Medicaid#: REDACTED' },
  
  // Medicare Numbers
  { regex: /\bMedicare Number:?\s*\w+\b/gi, replacement: 'Medicare Number: REDACTED' },
  { regex: /\bMedicare ID:?\s*\w+\b/gi, replacement: 'Medicare ID: REDACTED' },
  { regex: /\bMedicare#:?\s*\w+\b/gi, replacement: 'Medicare#: REDACTED' },
  
  // Patient/Client Names
  { regex: /\bPatient Name:?\s*[A-Za-z\s,.]+/gi, replacement: 'Patient Name: REDACTED' },
  { regex: /\bClient Name:?\s*[A-Za-z\s,.]+/gi, replacement: 'Client Name: REDACTED' },
  { regex: /\bName:?\s*[A-Za-z\s,.]+/gi, replacement: 'Name: REDACTED' },
  
  // Addresses
  { 
    regex: /\b\d+\s+[A-Za-z\s,.]+(?:Avenue|Lane|Road|Boulevard|Drive|Street|Ave|Ln|Rd|Blvd|Dr|St)\.?(?:\s+[A-Za-z]+)?(?:\s+[A-Za-z]{2})?\s+\d{5}(?:-\d{4})?\b/gi, 
    replacement: 'ADDRESS REDACTED' 
  },
  
  // IP Addresses
  { regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, replacement: 'IP.REDACTED' },
  
  // Authorization tokens and credentials
  { regex: /\b[Bb]earer\s+[A-Za-z0-9-._~+/]+=*\b/g, replacement: 'Bearer TOKEN.REDACTED' },
  { regex: /\b[Aa]uthorization:\s*[A-Za-z0-9-._~+/]+=*\b/g, replacement: 'Authorization: REDACTED' },
  { regex: /\b[Pp]assword:\s*\S+/g, replacement: 'password: REDACTED' },
  
  // Health-related information
  { regex: /\bDiagnosis:?\s*[A-Za-z0-9\s,.()-]+/gi, replacement: 'Diagnosis: REDACTED' },
  { regex: /\bTreatment:?\s*[A-Za-z0-9\s,.()-]+/gi, replacement: 'Treatment: REDACTED' },
  { regex: /\bCondition:?\s*[A-Za-z0-9\s,.()-]+/gi, replacement: 'Condition: REDACTED' },
];