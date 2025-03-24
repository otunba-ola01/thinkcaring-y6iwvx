import { Request, Response, NextFunction } from 'express'; // version 4.18+
import { z } from 'zod'; // version 3.21+
import multer from 'multer'; // version 1.4+
import { ValidationError } from '../errors/validation-error';
import { validateSchema } from '../utils/validation';
import { logger } from '../utils/logger';
import { ErrorCode } from '../types/error.types';

/**
 * Middleware factory that creates an Express middleware function to validate 
 * request parameters against a Zod schema
 * 
 * @param schema Zod schema to validate against
 * @returns Express middleware function that validates request parameters
 */
export const validateParams = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params;
      logger.debug('Validating request parameters', { path: req.path });
      const validatedParams = validateSchema(schema, params, 'request parameters');
      req.params = validatedParams as any; // Need to cast because Express expects string values
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.debug('Validation error in request parameters', { 
          path: req.path, 
          method: req.method,
          validationErrors: error.validationErrors 
        });
      } else {
        logger.error('Unexpected error during parameter validation', {
          path: req.path,
          method: req.method,
          error
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory that creates an Express middleware function to validate 
 * request query parameters against a Zod schema
 * 
 * @param schema Zod schema to validate against
 * @returns Express middleware function that validates request query parameters
 */
export const validateQuery = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query;
      logger.debug('Validating request query parameters', { path: req.path });
      const validatedQuery = validateSchema(schema, query, 'request query parameters');
      req.query = validatedQuery as any; // Need to cast because Express expects string values
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.debug('Validation error in request query parameters', { 
          path: req.path, 
          method: req.method,
          validationErrors: error.validationErrors 
        });
      } else {
        logger.error('Unexpected error during query validation', {
          path: req.path,
          method: req.method,
          error
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory that creates an Express middleware function to validate 
 * request body against a Zod schema
 * 
 * @param schema Zod schema to validate against
 * @returns Express middleware function that validates request body
 */
export const validateBody = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;
      logger.debug('Validating request body', { path: req.path });
      const validatedBody = validateSchema(schema, body, 'request body');
      req.body = validatedBody;
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.debug('Validation error in request body', { 
          path: req.path, 
          method: req.method,
          validationErrors: error.validationErrors 
        });
      } else {
        logger.error('Unexpected error during body validation', {
          path: req.path,
          method: req.method,
          error
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory that creates an Express middleware function to validate 
 * both request parameters and query parameters against Zod schemas
 * 
 * @param paramsSchema Zod schema to validate request parameters
 * @param querySchema Zod schema to validate query parameters
 * @returns Express middleware function that validates request parameters and query
 */
export const validateParamsAndQuery = <P, Q>(
  paramsSchema: z.ZodType<P>,
  querySchema: z.ZodType<Q>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params;
      const query = req.query;
      
      logger.debug('Validating request parameters and query', { path: req.path });
      
      const validatedParams = validateSchema(paramsSchema, params, 'request parameters');
      const validatedQuery = validateSchema(querySchema, query, 'request query parameters');
      
      req.params = validatedParams as any;
      req.query = validatedQuery as any;
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.debug('Validation error in request parameters or query', { 
          path: req.path, 
          method: req.method,
          validationErrors: error.validationErrors 
        });
      } else {
        logger.error('Unexpected error during parameters and query validation', {
          path: req.path,
          method: req.method,
          error
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory that creates an Express middleware function to validate 
 * both request parameters and body against Zod schemas
 * 
 * @param paramsSchema Zod schema to validate request parameters
 * @param bodySchema Zod schema to validate request body
 * @returns Express middleware function that validates request parameters and body
 */
export const validateParamsAndBody = <P, B>(
  paramsSchema: z.ZodType<P>,
  bodySchema: z.ZodType<B>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params;
      const body = req.body;
      
      logger.debug('Validating request parameters and body', { path: req.path });
      
      const validatedParams = validateSchema(paramsSchema, params, 'request parameters');
      const validatedBody = validateSchema(bodySchema, body, 'request body');
      
      req.params = validatedParams as any;
      req.body = validatedBody;
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.debug('Validation error in request parameters or body', { 
          path: req.path, 
          method: req.method,
          validationErrors: error.validationErrors 
        });
      } else {
        logger.error('Unexpected error during parameters and body validation', {
          path: req.path,
          method: req.method,
          error
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory that creates an Express middleware function to validate 
 * both request query parameters and body against Zod schemas
 * 
 * @param querySchema Zod schema to validate query parameters
 * @param bodySchema Zod schema to validate request body
 * @returns Express middleware function that validates request query and body
 */
export const validateQueryAndBody = <Q, B>(
  querySchema: z.ZodType<Q>,
  bodySchema: z.ZodType<B>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query;
      const body = req.body;
      
      logger.debug('Validating request query and body', { path: req.path });
      
      const validatedQuery = validateSchema(querySchema, query, 'request query parameters');
      const validatedBody = validateSchema(bodySchema, body, 'request body');
      
      req.query = validatedQuery as any;
      req.body = validatedBody;
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.debug('Validation error in request query or body', { 
          path: req.path, 
          method: req.method,
          validationErrors: error.validationErrors 
        });
      } else {
        logger.error('Unexpected error during query and body validation', {
          path: req.path,
          method: req.method,
          error
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory that creates an Express middleware function to validate 
 * request parameters, query parameters, and body against Zod schemas
 * 
 * @param paramsSchema Zod schema to validate request parameters
 * @param querySchema Zod schema to validate query parameters
 * @param bodySchema Zod schema to validate request body
 * @returns Express middleware function that validates request parameters, query, and body
 */
export const validateParamsQueryAndBody = <P, Q, B>(
  paramsSchema: z.ZodType<P>,
  querySchema: z.ZodType<Q>,
  bodySchema: z.ZodType<B>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params;
      const query = req.query;
      const body = req.body;
      
      logger.debug('Validating request parameters, query, and body', { path: req.path });
      
      const validatedParams = validateSchema(paramsSchema, params, 'request parameters');
      const validatedQuery = validateSchema(querySchema, query, 'request query parameters');
      const validatedBody = validateSchema(bodySchema, body, 'request body');
      
      req.params = validatedParams as any;
      req.query = validatedQuery as any;
      req.body = validatedBody;
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.debug('Validation error in request parameters, query, or body', { 
          path: req.path, 
          method: req.method,
          validationErrors: error.validationErrors 
        });
      } else {
        logger.error('Unexpected error during parameters, query, and body validation', {
          path: req.path,
          method: req.method,
          error
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory that creates an Express middleware function to validate file uploads
 * 
 * @param options Options for file validation
 * @returns Express middleware function that validates file uploads
 */
export const validateFile = (options: {
  required?: boolean;
  allowedMimeTypes?: string[];
  maxSize?: number; // in bytes
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if a file was uploaded
      if (options.required && !req.file) {
        const error = new ValidationError('File upload is required');
        error.addValidationError({
          field: 'file',
          message: 'File upload is required',
          value: null,
          code: ErrorCode.MISSING_REQUIRED_FIELD
        });
        throw error;
      }

      // If no file and not required, continue
      if (!req.file) {
        return next();
      }

      // Validate MIME type if specified
      if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
        if (!options.allowedMimeTypes.includes(req.file.mimetype)) {
          const error = new ValidationError('Invalid file type');
          error.addValidationError({
            field: req.file.fieldname,
            message: `Invalid file type. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
            value: req.file.mimetype,
            code: ErrorCode.INVALID_FORMAT
          });
          throw error;
        }
      }
      
      // Validate file size if specified
      if (options.maxSize && req.file.size > options.maxSize) {
        const sizeMB = Math.round(options.maxSize / 1024 / 1024 * 100) / 100;
        const error = new ValidationError('File too large');
        error.addValidationError({
          field: req.file.fieldname,
          message: `File size exceeds the limit of ${sizeMB} MB`,
          value: req.file.size,
          code: ErrorCode.INVALID_FORMAT
        });
        throw error;
      }
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.debug('File validation error', { 
          path: req.path,
          method: req.method,
          validationErrors: error.validationErrors 
        });
      } else {
        logger.error('Unexpected error during file validation', {
          path: req.path,
          method: req.method,
          error
        });
      }
      next(error);
    }
  };
};