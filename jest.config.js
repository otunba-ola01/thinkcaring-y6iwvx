/**
 * Root Jest Configuration for HCBS Revenue Management System
 *
 * This configuration file sets up Jest for testing both backend and frontend components
 * of the HCBS Revenue Management System. It enforces code coverage thresholds and
 * establishes quality gates as specified in the Technical Specifications.
 *
 * The configuration uses Jest's projects feature to run tests for different parts of the
 * application while maintaining a unified reporting structure and consistent test environment.
 *
 * @see Technical Specifications/6.6 TESTING STRATEGY for comprehensive testing approach
 * @see Technical Specifications/6.6.2 TEST AUTOMATION for CI/CD integration details
 * @see Technical Specifications/6.6.4 QUALITY METRICS for coverage requirements
 * 
 * @version 1.0.0
 */

module.exports = {
  // Define projects for multi-project testing (backend and frontend)
  projects: ['<rootDir>/src/backend', '<rootDir>/src/web'],
  
  // Enable code coverage collection
  collectCoverage: true,
  
  // Specify output directory for coverage reports
  coverageDirectory: '<rootDir>/coverage',
  
  // Configure coverage report formats
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  
  // Set minimum coverage thresholds as quality gates
  // These align with the requirements in Technical Specifications/6.6.4 QUALITY METRICS
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Set test timeout to handle complex integration tests
  testTimeout: 30000,
  
  // Enable verbose output for detailed test results
  verbose: true,
  
  // Configure test reporters including JUnit for CI integration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'junit.xml'
    }]
  ],
  
  // Reset mock state between tests for consistent test execution
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Patterns to ignore when running tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.next/'],
  
  // Patterns to ignore when watching for changes
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.next/']
};