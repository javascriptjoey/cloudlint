export default {
  // Test environment
  testEnvironment: 'node',
  
  // Module handling
  extensionsToTreatAsEsm: ['.js'],
  transform: {},
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/utils/**/*.js',
    'dev-server.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  
  // Module paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Globals
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};