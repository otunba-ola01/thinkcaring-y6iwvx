import express from 'express'; // Web framework for creating the API server // express ^4.18.2
import helmet from 'helmet'; // Security middleware to set HTTP headers // helmet ^6.1.5
import compression from 'compression'; // Middleware to compress HTTP responses // compression ^1.7.4
import 'express-async-errors'; // Middleware to handle async errors in Express routes // express-async-errors ^3.1.1
import cookieParser from 'cookie-parser'; // Middleware to parse cookies in requests // cookie-parser ^1.4.6
import cors from 'cors'; // Middleware to enable CORS // cors ^2.8.5
import { apiRoutes, errorMiddleware, notFoundMiddleware } from './routes'; // Import API routes and error handling middleware
import config from './config'; // Import application configuration settings
import { db } from './database'; // Import database connection management
import { corsMiddleware, logCorsRequest } from './middleware'; // Import application middleware components
import logger from './utils/logger'; // Import logging utility
import { createHealthCheckMiddleware } from './health'; // Import health check middleware
import { apiHealth } from './health'; // Import API performance monitoring middleware
import { initializeIntegrations } from './integrations'; // Import function to initialize integrations
import { createMetricsMiddleware } from './utils/metrics'; // Import function to create metrics middleware

/**
 * Initializes and configures the Express application with middleware, routes, and error handling
 * @returns Configured Express application instance
 */
async function initializeApp(): Promise<express.Application> {
  // Create a new Express application instance
  const app = express();

  // Initialize the database connection
  await db.initialize(true, config.env);

  // Configure security middleware (helmet, CORS)
  app.use(helmet());
  app.use(corsMiddleware());
  app.use(logCorsRequest);

  // Configure request parsing middleware (json, urlencoded, cookie-parser)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Configure compression middleware
  app.use(compression());

  // Configure logging middleware (morgan)
  // TODO: Re-enable morgan after fixing the types
  // app.use(morganLogger());

  // Configure rate limiting middleware for different API categories
  // TODO: Implement rate limiting middleware

  // Configure health check middleware
  app.use(createHealthCheckMiddleware());

  // Configure API performance monitoring middleware
  app.use(apiHealth.createApiPerformanceMiddleware());

  // Mount API routes at /api
  app.use('/api', apiRoutes);

  // Configure 404 handler for undefined routes
  app.use(notFoundMiddleware);

  // Configure global error handling middleware
  app.use(errorMiddleware);

  // Configure Swagger UI for API documentation
  // TODO: Implement Swagger UI setup

  // Initialize integrations
  await initializeIntegrations();

  // Configure Prometheus metrics endpoint
  app.use(createMetricsMiddleware());

  // Log successful application initialization
  logger.info('Application initialized successfully');

  // Return the configured Express application
  return app;
}

// Export the initializeApp function as the default export
export default initializeApp;