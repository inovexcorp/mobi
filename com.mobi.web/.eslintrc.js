module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    'standard': {
      'env': [ 'karma' ],
    },
    plugins: [
      '@typescript-eslint',
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
      // require a space before & after certain keywords
      'keyword-spacing': ['error', {
        before: true,
        after: true,
        overrides: {
          return: { after: true },
          throw: { after: true },
          case: { after: true }
        }
      }]
    },
  };