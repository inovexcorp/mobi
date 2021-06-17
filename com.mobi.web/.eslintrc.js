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
    'eqeqeq': 'error',
    'curly': 'error',
    'quotes': ['error', 'single'],
    // enforces spacing between keys and values in object literal properties
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    // enforce consistent spacing before and after keywords (keyword-spacing)
    'keyword-spacing': ['error', {
      before: true,
      after: true,
      overrides: {
        return: { after: true },
        throw: { after: true },
        case: { after: true }
      }
    }],
    // Disallows/allows the use of require statements except in import statements.
    '@typescript-eslint/no-var-requires': 0,
    // Multiple empty lines
    'no-multiple-empty-lines': [
      'error', {
        'max': 1,
        'maxEOF': 0 
      }
    ],
    //require or disallow semicolons
    'semi': ['error', 'always'],
    // opening curly brace of a block is placed on the same line as its corresponding statement or declaration
    'brace-style': 2,
    // Allow empty functions
    //note you must disable the base rule as it can report incorrect errors
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': [
      'error',
      {
        'allow': ['constructors', 'arrowFunctions']
      }
    ],
    '@typescript-eslint/no-this-alias': [
      'error',
      {
        'allowDestructuring': true, // Allow `const { props, state } = this`; false by default
        'allowedNames': ['self', 'dvm'] // Allow `const self = this`; `[]` by default
      }
    ]

  },
};