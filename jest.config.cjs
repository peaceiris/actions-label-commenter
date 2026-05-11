const {createDefaultEsmPreset} = require('ts-jest');

const preset = createDefaultEsmPreset({
  tsconfig: 'tsconfig.test.json'
});

module.exports = {
  ...preset,
  silent: true,
  verbose: true,
  collectCoverage: true,
  bail: 1,
  clearMocks: true,
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js']
};
