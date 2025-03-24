import { Request, Response, NextFunction, RequestHandler } from 'express'; // express 4.18.2
import { getTransaction } from '../database/connection';
import { Transaction } from '../types/database.types';
import { DatabaseError } from '../errors/database-error';
import { logger } from '../utils/logger';

// Extend Express Request interface to include transaction
declare global {
  namespace Express {
    interface Request {
      transaction?: Transaction;
    }
  }
}

/**
 * Higher-order function that wraps a request handler with transaction management.
 * This ensures all database operations within the handler are executed within a transaction.
 * 
 * @param handler - The request handler to wrap with transaction management
 * @returns A new request handler with transaction management
 */
export const withTransaction = (handler: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip if transaction already exists on the request
    if (req.transaction) {
      return handler(req, res, next);
    }

    try {
      // Create a new transaction
      const transaction = await getTransaction();
      
      // Add transaction to the request object
      req.transaction = transaction;
      
      logger.debug('Transaction created for request handler', { 
        path: req.path,
        method: req.method
      });
      
      // Execute the handler
      await handler(req, res, next);
      
      // If we get here and the headers haven't been sent, commit the transaction
      // This handles the case where the handler completes successfully without sending a response
      if (req.transaction && !res.headersSent) {
        await req.transaction.commit();
        logger.debug('Transaction committed after handler completion', {
          path: req.path,
          method: req.method
        });
        req.transaction = undefined;
      }
    } catch (error) {
      // If an error occurred and we have a transaction, roll it back
      if (req.transaction) {
        try {
          await req.transaction.rollback();
          logger.debug('Transaction rolled back due to error', {
            path: req.path,
            method: req.method,
            error: error instanceof Error ? error.message : String(error)
          });
          req.transaction = undefined;
        } catch (rollbackError) {
          logger.error('Failed to roll back transaction', {
            error: rollbackError,
            originalError: error
          });
        }
      }
      
      // Pass the error to the next error handler
      next(error);
    }
  };
};

/**
 * Middleware factory that creates a transaction and attaches it to the request object.
 * This ensures all subsequent middleware and route handlers can use the same transaction.
 * 
 * @param options - Configuration options for the middleware
 * @returns Express middleware function that manages transactions
 */
export const transactionMiddleware = (options: object = {}): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip if transaction already exists on the request
    if (req.transaction) {
      return next();
    }

    try {
      // Create a new transaction
      const transaction = await getTransaction();
      const correlationId = req.headers['x-correlation-id'] || 'none';
      
      // Add transaction to the request object
      req.transaction = transaction;
      
      logger.info('Transaction created for request', {
        path: req.path,
        method: req.method,
        correlationId
      });
      
      // Handle successful completion of the response
      res.on('finish', () => {
        if (req.transaction) {
          // Only commit if status code is successful (2xx)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            req.transaction.commit()
              .then(() => {
                logger.debug('Transaction committed on response finish', {
                  path: req.path,
                  method: req.method,
                  statusCode: res.statusCode,
                  correlationId
                });
                req.transaction = undefined;
              })
              .catch((error) => {
                logger.error('Failed to commit transaction on response finish', {
                  error,
                  path: req.path,
                  method: req.method,
                  statusCode: res.statusCode,
                  correlationId
                });
              });
          } else {
            // Roll back for non-successful responses
            req.transaction.rollback()
              .then(() => {
                logger.debug('Transaction rolled back on non-successful response', {
                  path: req.path,
                  method: req.method,
                  statusCode: res.statusCode,
                  correlationId
                });
                req.transaction = undefined;
              })
              .catch((error) => {
                logger.error('Failed to roll back transaction on non-successful response', {
                  error,
                  path: req.path,
                  method: req.method,
                  statusCode: res.statusCode,
                  correlationId
                });
              });
          }
        }
      });
      
      // Handle client disconnects or other closures before response is finished
      res.on('close', () => {
        // Only roll back if the response hasn't been fully sent
        if (req.transaction && !res.writableFinished) {
          req.transaction.rollback()
            .then(() => {
              logger.debug('Transaction rolled back due to client disconnect', {
                path: req.path,
                method: req.method,
                correlationId
              });
              req.transaction = undefined;
            })
            .catch((error) => {
              logger.error('Failed to roll back transaction on client disconnect', {
                error,
                path: req.path,
                method: req.method,
                correlationId
              });
            });
        }
      });
      
      // Handle errors on the response object
      res.on('error', (error) => {
        if (req.transaction) {
          req.transaction.rollback()
            .then(() => {
              logger.debug('Transaction rolled back due to response error', {
                path: req.path,
                method: req.method,
                error: error.message,
                correlationId
              });
              req.transaction = undefined;
            })
            .catch((rollbackError) => {
              logger.error('Failed to roll back transaction on response error', {
                error: rollbackError,
                originalError: error,
                path: req.path,
                method: req.method,
                correlationId
              });
            });
        }
      });
      
      // Proceed to next middleware
      next();
    } catch (error) {
      // If an error occurred during transaction creation, pass it to the next error handler
      logger.error('Error creating transaction', {
        error,
        path: req.path,
        method: req.method
      });
      
      next(error);
    }
  };
};