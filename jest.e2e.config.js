export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/e2e/**/*.test.ts'],
  setupFilesAfterEnv: ['./test/setup/e2e.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  verbose: true,
  detectOpenHandles: true
};