module.exports = {
  root: true,
  'env': {
    'amd': true,
    'browser': true,
    'node': true,
    'jasmine': true,
    'angular/mocks': true
  },
  parser: '@typescript-eslint/parser',
  globals: {
    'angular': true
  },
  plugins: [
    '@typescript-eslint',
    'angular'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  'rules': {
    'eqeqeq': 'off',
    'curly': 'error',
    'quotes': ['error', 'single'],
    // enforces spacing between keys and values in object literal properties
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],

    'keyword-spacing': ['error', {
      before: true,
      after: true,
      overrides: {
        return: { after: true },
        throw: { after: true },
        case: { after: true }
      }
    }],
    '@typescript-eslint/no-var-requires': 0,
  },
};