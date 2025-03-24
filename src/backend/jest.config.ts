import type { Config } from '@jest/types'; // @jest/types ^29.5.0

/**
 * Jest configuration for the HCBS Revenue Management System backend.
 * This configuration sets up test environments, coverage requirements,
 * and organizes tests by type (unit, integration, e2e).
 */
const config: Config.InitialOptions = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Use Node.js as the test environment
  testEnvironment: 'node',
  
  // Define the root directory for tests
  roots: ['<rootDir>/src'],
  
  // Match test files with .test.ts extension
  testMatch: ['**/*.test.ts'],
  
  // Configure TypeScript transform with ts-jest
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  
  // Define file extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Configure path alias for imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Enable coverage collection
  collectCoverage: true,
  
  // Define directory for coverage reports
  coverageDirectory: '<rootDir>/coverage',
  
  // Configure coverage reporters
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  
  // Define coverage thresholds
  coverageThreshold: {
    // Global threshold of 80%
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Higher threshold of 90% for core services
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Configure separate projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/tests/unit/**/*.test.ts'],
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/tests/integration/**/*.test.ts'],
      testEnvironment: 'node',
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/tests/e2e/**/*.test.ts'],
      testEnvironment: 'node',
    },
  ],
  
  // Setup files to run after the environment is set up
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  
  // Global setup and teardown scripts
  globalSetup: '<rootDir>/src/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/src/tests/globalTeardown.ts',
  
  // Enable verbose output
  verbose: true,
  
  // Set timeout for tests (30 seconds)
  testTimeout: 30000,
  
  // Configure reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'junit.xml',
    }],
  ],
  
  // Clear mocks before each test
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Patterns to ignore for tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Patterns to ignore for watch mode
  watchPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;