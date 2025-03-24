import React, { ReactNode } from 'react'; // react v18.2.0
import {
  renderHook,
  RenderHookOptions,
  RenderHookResult
} from '@testing-library/react-hooks'; // @testing-library/react-hooks v8.0.1
import { Provider } from 'react-redux'; // react-redux v8.0.5
import { MemoryRouter, Routes, Route } from 'react-router-dom'; // react-router-dom v6.11.2

import { createTestStore } from './test-utils';
import { RootState } from '../../store';
import { ThemeMode } from '../../types/common.types';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import { createMockAuthUser } from './mock-data';

/**
 * Options for rendering hooks with providers
 */
interface RenderHookWithProvidersOptions<TProps> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
  route?: string;
  user?: object | null;
  initialProps?: TProps;
}

/**
 * Extended render hook result with additional utilities
 */
interface ExtendedRenderHookResult<TResult> {
  store: ReturnType<typeof createTestStore>;
  result: RenderHookResult<TResult, any>;
}

/**
 * Wrapper component that provides all necessary context providers for testing hooks
 */
const AllTheProviders = <TProps extends object>({
  children,
  options
}: {
  children: ReactNode;
  options: RenderHookWithProvidersOptions<TProps>;
}): JSX.Element => {
  // Extract options with defaults (store, preloadedState, route, user)
  const { store: customStore, preloadedState, route = '/', user = createMockAuthUser() } = options;

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
          <Route
            path="*"
            element={
              <ThemeProvider initialThemeMode={ThemeMode.LIGHT}>
                <AuthProvider initialUser={user}>
                  <ToastProvider>{children}</ToastProvider>
                </AuthProvider>
              </ThemeProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

/**
 * Renders a React hook with all necessary providers for testing
 */
const renderHookWithProviders = <TResult, TProps extends object = {}>(\
  callback: (initialProps: TProps) => TResult,
  options: RenderHookWithProvidersOptions<TProps> = {}
): ExtendedRenderHookResult<TResult> => {
  // Extract options with defaults (store, preloadedState, route, user)
  const { store: customStore, preloadedState, route = '/', user = createMockAuthUser(), initialProps } = options;

  // Create a test store if not provided
  const testStore = customStore || createTestStore(preloadedState);

  // Create a wrapper component with all providers (Redux, Router, Theme, Auth, Toast)
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <AllTheProviders options={{ store: testStore, preloadedState, route, user, initialProps }}>
      {children}
    </AllTheProviders>
  );

  // Call the original renderHook with the callback and wrapper
  const renderHookResult = renderHook(callback, { wrapper, initialProps });

  // Return the renderHook result with additional utilities (store)
  return {
    store: testStore,
    result: renderHookResult
  };
};

export default renderHookWithProviders;