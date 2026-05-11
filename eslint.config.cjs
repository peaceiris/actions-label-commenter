const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const jestPlugin = require('eslint-plugin-jest');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

const nodeGlobals = {
  Buffer: 'readonly',
  __dirname: 'readonly',
  console: 'readonly',
  process: 'readonly'
};

module.exports = [
  {
    ignores: ['coverage/**', 'dist/**', 'dist_release/**', 'node_modules/**']
  },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2021,
      globals: nodeGlobals,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      },
      sourceType: 'module'
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx']
        },
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        }
      }
    },
    rules: {
      'import/default': 2,
      'import/dynamic-import-chunkname': 2,
      'import/export': 2,
      'import/exports-last': 2,
      'import/extensions': 2,
      'import/first': 2,
      'import/group-exports': 2,
      'import/imports-first': 2,
      'import/max-dependencies': 0,
      'import/named': 2,
      'import/namespace': 2,
      'import/newline-after-import': 2,
      'import/no-absolute-path': 2,
      'import/no-amd': 2,
      'import/no-anonymous-default-export': 2,
      'import/no-commonjs': 2,
      'import/no-cycle': 2,
      'import/no-default-export': 0,
      'import/no-deprecated': 2,
      'import/no-duplicates': 2,
      'import/no-dynamic-require': 2,
      'import/no-extraneous-dependencies': 2,
      'import/no-import-module-exports': 2,
      'import/no-internal-modules': 0,
      'import/no-mutable-exports': 2,
      'import/no-named-as-default': 2,
      'import/no-named-as-default-member': 2,
      'import/no-named-default': 2,
      'import/no-named-export': 0,
      'import/no-namespace': 2,
      'import/no-nodejs-modules': 0,
      'import/no-relative-packages': 2,
      'import/no-relative-parent-imports': 0,
      'import/no-restricted-paths': 2,
      'import/no-self-import': 2,
      'import/no-unassigned-import': 2,
      'import/no-unresolved': [2, {amd: true, commonjs: true}],
      'import/no-unused-modules': 2,
      'import/no-useless-path-segments': 2,
      'import/no-webpack-loader-syntax': 2,
      'import/order': 0,
      'import/prefer-default-export': 0,
      'import/unambiguous': 0,
      'preserve-caught-error': 0
    }
  },
  {
    files: ['**/*.test.ts'],
    ...jestPlugin.configs['flat/recommended']
  },
  prettierRecommended
];
