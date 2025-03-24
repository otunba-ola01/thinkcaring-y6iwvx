// msw: ^1.2.1
import { setupWorker } from 'msw';
import { handlers } from './handlers';

/**
 * Configures and exports a Mock Service Worker (MSW) instance for browser environments.
 * This file sets up the request interception for API mocking during development and testing in the browser,
 * enabling frontend development without a backend dependency.
 * 
 * @remarks
 * - Creates an MSW worker instance with the imported handlers.
 * - Called during application initialization in development mode.
 * - Stops the request interception and cleans up when the application is unmounted or during cleanup.
 * - Resets any runtime request handlers to the initial handlers between tests to ensure a clean state.
 * - Replaces or adds runtime request handlers to override handlers for specific test cases.
 * 
 * @see {@link https://mswjs.io/docs/ } for more information on MSW.
 */

/**
 * MSW worker instance for intercepting and mocking API requests in browser environment
 */
export const worker = setupWorker(...handlers);

/**
 * Configuration options for the MSW worker
 */
const workerOptions = {
  onUnhandledRequest: 'warn', // Warns about unhandled requests
  serviceWorker: {
    url: '/mockServiceWorker.js', // Specifies the URL of the mock service worker
    options: {
      scope: '/' // Sets the scope of the service worker to the entire application
    }
  }
};

/**
 * Starts the request interception
 * @description Called during application initialization in development mode
 */
worker.start(workerOptions);

/**
 * Stops the request interception and cleans up
 * @description Called when the application is unmounted or during cleanup
 */
export const stopWorker = () => {
  worker.close();
};

/**
 * Resets any runtime request handlers to the initial handlers
 * @description Used between tests to ensure a clean state
 */
export const resetHandlers = () => {
  worker.resetHandlers();
};

/**
 * Replaces or adds runtime request handlers
 * @description Used to override handlers for specific test cases
 */
export const use = (...newHandlers: Parameters<typeof worker.use>) => {
  worker.use(...newHandlers);
};