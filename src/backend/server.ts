import http from 'http'; // Node.js built-in HTTP module for creating the server // latest
import initializeApp from './app'; // Import the Express application initialization function
import config from './config'; // Import application configuration settings
import logger from './utils/logger'; // Import logging utility for server logs

// Define global constants
const PORT = process.env.PORT || 3001;

/**
 * Initializes the Express application and starts the HTTP server
 * @returns HTTP server instance
 */
async function startServer(): Promise<http.Server> {
  // LD1: Initialize the Express application by calling initializeApp()
  const app = await initializeApp();

  // LD1: Get the port number from environment variables or use default (3001)
  const port = PORT;

  // LD1: Create an HTTP server with the Express application
  const server = http.createServer(app);

  // LD1: Start listening on the specified port
  server.listen(port, () => {
    // LD1: Log server startup information
    logger.info(`Server listening on port ${port}`);
  });

  // LD1: Return the HTTP server instance
  return server;
}

/**
 * Configures graceful shutdown handlers for the server
 * @param server HTTP server instance
 */
function setupGracefulShutdown(server: http.Server): void {
  // LD1: Set up event listeners for SIGTERM and SIGINT signals
  process.on('SIGTERM', () => {
    // LD1: When signal received, log shutdown initiation
    logger.info('SIGTERM signal received: shutting down');

    // LD1: Stop accepting new connections
    server.close(() => {
      // LD1: Log successful shutdown
      logger.info('HTTP server closed');

      // LD1: Exit the process with appropriate code
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    // LD1: When signal received, log shutdown initiation
    logger.info('SIGINT signal received: shutting down');

    // LD1: Stop accepting new connections
    server.close(() => {
      // LD1: Log successful shutdown
      logger.info('HTTP server closed');

      // LD1: Exit the process with appropriate code
      process.exit(0);
    });
  });
}

/**
 * Sets up global error handlers for uncaught exceptions and unhandled promise rejections
 */
function handleUncaughtErrors(): void {
  // LD1: Set up event listener for uncaught exceptions
  process.on('uncaughtException', (err) => {
    // LD1: Log the error details with stack trace
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    // LD1: Exit the process with error code in production environment
    if (config.isProduction) {
      process.exit(1);
    }
  });

  // LD1: Set up event listener for unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    // LD1: Log the rejection details with reason
    logger.error('Unhandled promise rejection', { reason, promise });
    // LD1: Exit the process with error code in production environment
    if (config.isProduction) {
      process.exit(1);
    }
  });
}

/**
 * Main function that orchestrates server startup and error handling
 */
async function main(): Promise<void> {
  // LD1: Set up handlers for uncaught errors
  handleUncaughtErrors();

  // LD1: Start the server and get the server instance
  const server = await startServer();

  // LD1: Set up graceful shutdown handlers
  setupGracefulShutdown(server);

  // LD1: Log successful server initialization
  logger.info('Server initialized successfully');
}

// Call the main function to start the server
main();