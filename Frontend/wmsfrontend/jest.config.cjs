/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',

  // Runs early for polyfills
  setupFiles: ['<rootDir>/jest.polyfills.js'],

  // Runs after the test environment (jsdom) is installed – the correct
  // place to import @testing-library/jest-dom so it can extend expect().
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.js'],

  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },

  moduleNameMapper: {
    // CSS modules → identity proxy
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Static assets → stub
    '\\.(jpg|jpeg|png|gif|svg|webp|ico)$': '<rootDir>/src/tests/__mocks__/fileMock.js',
    // Intercept real axios calls with our manual mock
    '.*/api/axios$': '<rootDir>/src/tests/__mocks__/axios.js',
    '.*/api/axios\\.js$': '<rootDir>/src/tests/__mocks__/axios.js',
    '(.*)/lib/firebase$': '<rootDir>/src/tests/__mocks__/firebase.js',
  },

  // Only pick up tests inside our tests/ directory
  testMatch: ['<rootDir>/src/tests/**/*.test.{js,jsx}'],

  // Coverage settings
  collectCoverageFrom: [
    'src/features/**/*.{js,jsx}',
    'src/context/**/*.{js,jsx}',
    'src/routes/**/*.{js,jsx}',
    '!src/tests/**',
    '!src/main.jsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true,
  
};
