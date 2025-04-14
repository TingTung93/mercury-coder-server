/** @type {import('jest').Config} */
const config = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  setupFilesAfterEnv: ['./test/setup/jest.setup.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@modelcontextprotocol)/)'
  ],
  // Force Jest to use ESM
  moduleFileExtensions: ['js', 'ts', 'mjs', 'json'],
};

export default config; 