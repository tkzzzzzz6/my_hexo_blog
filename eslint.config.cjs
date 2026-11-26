'use strict';
module.exports = [{
  files: ['tools/agent-flow/**/*.cjs', 'eslint.config.cjs'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { require: 'readonly', module: 'readonly', process: 'readonly', console: 'readonly', Buffer: 'readonly', __dirname: 'readonly', URL: 'readonly' } },
  rules: { 'no-undef': 'error', 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], 'no-unreachable': 'error', 'no-constant-condition': 'error', 'no-dupe-keys': 'error', 'no-empty': ['error', { allowEmptyCatch: true }], eqeqeq: 'error' }
}];
