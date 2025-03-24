import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'; // @testing-library/react v13.4.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event v14.4.3
import React, { ReactNode } from 'react'; // react v18.2.0
import { Provider } from 'react-redux'; // react-redux v8.0.5
import { act } from 'react-dom/test-utils'; // react-dom/test-utils v18.2.0

import store, { RootState } from '../store';
import { ThemeMode } from '../types/common.types';
import { ApiResponse } from '../types/api.types';
import { formatApiResponse, formatApiError } from './api';

interface MockOptions {
  delay?: number;
  errorProbability?: number;
}

/**
 * Creates a mock API response for testing API calls
 * @param data 
 * @param success 
 * @param error 
 * @returns Returns a Promise that resolves or rejects with the mocked response
 */
export const mockApiResponse = async <T>(
  data: T,
  success: boolean = true,
  error: any = null,
  options: MockOptions = {}
): Promise<ApiResponse<T>> => {
  const { delay = 100, errorProbability = 0 } = options;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!success) {
        reject(formatApiError(error));
      } else {
        resolve(formatApiResponse<T>({ data: data } as any));
      }
    }, delay);
  });
};

/**
 * Creates a Redux store with optional preloaded state for testing
 * @param preloadedState 
 * @returns Returns a configured Redux store instance
 */
export const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: store.reducer,
    preloadedState
  });
};

/**
 * Creates a mock File object for testing file uploads
 * @param name 
 * @param type 
 * @param size 
 * @returns Returns a mock File object
 */
export const createMockFile = (name: string, type: string, size: number): File => {
  const blob = new Blob([''], { type });
  blob['name'] = name;

  return blob as File;
};

/**
 * Creates a mock authenticated user for testing
 * @param overrides 
 * @returns Returns a mock user object
 */
export const createMockAuthUser = (overrides: Partial<any> = {}) => {
  const defaultUser = {
    id: 'test-user-id',
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin'
  };

  return { ...defaultUser, ...overrides };
};

/**
 * Creates a mock claim object for testing
 * @param overrides 
 * @returns Returns a mock claim object
 */
export const createMockClaim = (overrides: Partial<any> = {}) => {
  const defaultClaim = {
    id: 'test-claim-id',
    client: 'test-client-id',
    service: 'test-service-id',
    amount: 100,
    status: 'submitted'
  };

  return { ...defaultClaim, ...overrides };
};

/**
 * Creates a mock payment object for testing
 * @param overrides 
 * @returns Returns a mock payment object
 */
export const createMockPayment = (overrides: Partial<any> = {}) => {
  const defaultPayment = {
    id: 'test-payment-id',
    payer: 'test-payer-id',
    amount: 500,
    date: '2023-08-01',
    status: 'paid'
  };

  return { ...defaultPayment, ...overrides };
};

/**
 * Creates a mock service object for testing
 * @param overrides 
 * @returns Returns a mock service object
 */
export const createMockService = (overrides: Partial<any> = {}) => {
  const defaultService = {
    id: 'test-service-id',
    client: 'test-client-id',
    type: 'therapy',
    date: '2023-08-15',
    units: 2,
    rate: 75
  };

  return { ...defaultService, ...overrides };
};

export { screen, waitFor, waitForElementToBeRemoved, act };
export { userEvent };