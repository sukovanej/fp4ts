module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './packages',
  transform: {
    '^.+\\.ts$': [
      '@swc-node/jest',
      { jsc: { target: 'es2021' }, sourceMaps: 'inline' },
    ],
  },
  testRegex: '.spec.ts$',
  roots: [
    '<rootDir>/../scripts/__tests__',
    '<rootDir>/cats/__tests__',
    '<rootDir>/cats/core/src',
    '<rootDir>/cats/free/__tests__',
    '<rootDir>/cats/laws/src',
    '<rootDir>/core/src',
    '<rootDir>/effect/__tests__',
    '<rootDir>/effect/core/src',
    '<rootDir>/effect/kernel/src',
    '<rootDir>/effect/laws/src',
    '<rootDir>/effect/std/src',
    '<rootDir>/logging/__tests__',
    '<rootDir>/http/__tests__',
    '<rootDir>/optics/__tests__',
    '<rootDir>/parse/__tests__',
    '<rootDir>/schema/__tests__',
    '<rootDir>/schema/core/src',
    '<rootDir>/sql/__tests__',
    '<rootDir>/sql/mariadb/__tests__',
    '<rootDir>/sql/pg/__tests__',
    '<rootDir>/sql/sqlite/__tests__',
    '<rootDir>/stream/__tests__',
    '<rootDir>/stream/core/src',
    '<rootDir>/examples/fp-to-the-max',
    '<rootDir>/examples/todo-api',
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../jest-setup.js'],
  coverageDirectory: '../coverage',
  collectCoverageFrom: ['<rootDir>/**/*.{js,ts}'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/*test-kit/',
    '/examples/',
    '/__tests__/',
  ],
  coverageProvider: 'v8',
};
