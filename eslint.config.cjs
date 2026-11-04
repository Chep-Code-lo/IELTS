const js = require('@eslint/js');
const globals = require('globals');
module.exports = [
  { ignores: ['node_modules/**', '.history/**', 'vocab-a1-b1-data.js', 'vocab-data.js', 'cam_vocab_generated.js', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  { files: ['**/*.js', '**/*.cjs'], languageOptions: { globals: { ...globals.browser, ...globals.node, VOCAB_DATA: 'readonly' } } },
  { files: ['app.js'], rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^currentSection$' }] } }
];
