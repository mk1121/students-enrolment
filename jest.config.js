module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    'server.js',
    'migrate.js',
    '!server/node_modules/**',
    '!**/node_modules/**',
    '!coverage/**',
    '!tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true,
  // Better compatibility with Bun
  transform: {},
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  // Ignore patterns for better performance
  testPathIgnorePatterns: [
    '/node_modules/',
    '/client/',
    '/coverage/',
    '/logs/',
    '/uploads/',
  ],
};
