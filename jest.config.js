export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }]
  },
  moduleNameMapper: {
    '^../src/(.*)\\.js$': '<rootDir>/src/$1.ts',
    '^./(.*)\\.js$': '<rootDir>/src/$1.ts'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true
};
