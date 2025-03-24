import React, { ReactNode } from 'react'; // react v18.2.0
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'; // @testing-library/react v13.4.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event v14.4.3
import { Provider } from 'react-redux'; // react-redux v8.0.5
import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9.5
import { MemoryRouter, Routes, Route } from 'react-router-dom'; // react-router-dom v6.11.2

import store, { RootState } from '../../store';
import rootReducer from '../../store/rootReducer';
import { ThemeMode } from '../../types/common.types';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import { createMockUser } from './mock-data';
import { mockApiResponse } from './mock-api';

/**
 * Options for rendering components with providers
 */
interface RenderOptions {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
  route?: string;
  user?: object | null;
}

/**
 * Extended render result with additional utilities
 */
interface ExtendedRenderResult {
  store: ReturnType<typeof createTestStore>;
  user: object | null;
}

/**
 * Creates a Redux store with optional preloaded state for testing
 * @param preloadedState 
 * @returns Returns a configured Redux store instance
 */
function createTestStore(preloadedState?: Partial<RootState>) {
  // Use configureStore to create a new Redux store
  // Use the root reducer from the main store
  // Apply the provided preloaded state if any
  const testStore = configureStore({ 
    reducer: rootReducer,
    preloadedState 
  });

  // Return the configured store
  return testStore;
}

/**
 * Wrapper component that provides all necessary context providers for testing
 */
const AllTheProviders: React.FC<{ children: ReactNode; options: RenderOptions }> = ({ children, options }) => {
  // Extract options with defaults (store, preloadedState, route, user)
  const {
    store: customStore,
    preloadedState,
    route = '/',
    user = createMockUser()
  } = options;

  // Create a test store if not provided
  const testStore = customStore || createTestStore(preloadedState);

  // Wrap children with Redux Provider using the test store
  // Wrap with MemoryRouter configured with the specified route
  // Wrap with ThemeProvider using light theme mode
  // Wrap with AuthProvider with optional mock user
  // Wrap with ToastProvider for notification testing
  return (
    <Provider store={testStore}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={
            <ThemeProvider initialThemeMode={ThemeMode.LIGHT}>
              <AuthProvider initialUser={user}>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </AuthProvider>
            </ThemeProvider>
          } />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

/**
 * Renders a React component with all necessary providers for testing
 * @param ui 
 * @param options 
 * @returns Returns the render result with additional utilities
 */
function renderWithProviders(
  ui: ReactNode,
  options: RenderOptions = {}
) {
  // Extract options with defaults (store, preloadedState, route, user)
  const {
    store: customStore,
    preloadedState,
    route = '/',
    user = createMockUser()
  } = options;

  // Create a test store if not provided
  const testStore = customStore || createTestStore(preloadedState);

  // Create a wrapper component with all providers (Redux, Router, Theme, Auth, Toast)
  // Render the UI with the wrapper
  const renderResult = render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders options={{ store: testStore, preloadedState, route, user }}>
        {children}
      </AllTheProviders>
    )
  });

  // Return the render result with additional utilities (store, user)
  return {
    ...renderResult,
    store: testStore,
    user
  };
}

/**
 * Sets up userEvent for simulating user interactions in tests
 * @returns Returns a configured userEvent instance
 */
function setupUserEvent() {
  // Call userEvent.setup with default options
  const user = userEvent.setup();

  // Return the configured userEvent instance
  return user;
}

// Re-export screen from RTL for convenience
export { screen };

// Re-export waitFor from RTL for convenience
export { waitFor };

// Re-export waitForElementToBeRemoved from RTL for convenience
export { waitForElementToBeRemoved };

// Re-export userEvent for convenience
export { userEvent };

// Export the renderWithProviders function
export { renderWithProviders };

// Export the createTestStore function
export { createTestStore };

// Export the setupUserEvent function
export { setupUserEvent };