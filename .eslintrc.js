module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  plugins: ['prettier'],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      files: ['**/sslcommerz.js'],
      rules: {
        camelcase: 'off',
      },
    },
    {
      files: ['**/utils/*.js', '**/email.js'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['**/routes/*.js'],
      rules: {
        'no-console': ['warn', { allow: ['error', 'warn'] }],
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',
    
    // Error prevention
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'error',
    'no-extra-semi': 'error',
    'no-func-assign': 'error',
    'no-irregular-whitespace': 'error',
    'no-sparse-arrays': 'error',
    'no-unexpected-multiline': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
    
    // Best practices
    curly: 'error',
    'dot-notation': 'error',
    eqeqeq: ['error', 'always'],
    'no-alert': 'error',
    'no-caller': 'error',
    'no-else-return': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-fallthrough': 'error',
    'no-floating-decimal': 'error',
    'no-implied-eval': 'error',
    'no-lone-blocks': 'error',
    'no-loop-func': 'error',
    'no-multi-str': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-octal': 'error',
    'no-octal-escape': 'error',
    'no-param-reassign': 'error',
    'no-proto': 'error',
    'no-redeclare': 'error',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-with': 'error',
    radix: 'error',
    'vars-on-top': 'error',
    'wrap-iife': 'error',
    yoda: 'error',
    
    // Code quality and logic (non-formatting rules)
    camelcase: 'error',
    'func-names': 'error',
    'func-style': ['error', 'declaration'],
    'max-nested-callbacks': 'error',
    'new-cap': 'error',
    'no-array-constructor': 'error',
    'no-lonely-if': 'error',
    'no-nested-ternary': 'error',
    'no-new-object': 'error',
    'no-unneeded-ternary': 'error',
    'one-var': ['error', 'never'],
  },
  ignorePatterns: [
    'node_modules/',
    'client/build/',
    'client/node_modules/',
    'coverage/',
    'dist/',
    '*.min.js',
  ],
};
