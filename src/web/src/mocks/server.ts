// msw: ^1.2.1
import { setupServer } from 'msw/node'; // Import setupServer from MSW for Node.js environment

import { handlers } from './handlers'; // Import request handlers for API mocking

/**
 * Configures and exports a Mock Service Worker (MSW) server instance for Node.js environments.
 * This file sets up the request interception for API mocking during testing in Node.js environment,
 * particularly for Jest tests. It ensures consistent API mocking behavior across both server and client environments.
 */

/**
 * Creates an MSW server instance with the imported handlers
 */
const server = setupServer(...handlers);

/**
 * MSW server instance for intercepting and mocking API requests in Node.js environment
 */
export { server };

// Server configuration methods with descriptions and usage notes
server.listen({
  onUnhandledRequest: 'warn', // Warn about unhandled requests
  /**
   * Starts the request interception
   * Called before tests run, typically in setupTests or similar file
   */
});

server.close(
  /**
   * Stops the request interception and cleans up
   * Called after tests complete to ensure proper cleanup
   */
);

server.resetHandlers(
  /**
   * Resets any runtime request handlers to the initial handlers
   * Used between tests to ensure a clean state
   */
);

server.use(
  /**
   * Replaces or adds runtime request handlers
   * Used to override handlers for specific test cases
   */
);