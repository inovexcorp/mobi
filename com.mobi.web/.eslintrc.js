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
    'angular',
    'jasmine'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jasmine/recommended'
  ],
  'rules': {
    'eqeqeq': 'warn',
    'curly': 'warn',
    '@typescript-eslint/no-extra-semi': 'warn',
    'no-undef': 'warn',
    'no-redeclare': 'warn',
    'no-var': 'warn',
    'prefer-const': 'warn',
    'no-useless-escape': 'warn',
    'no-unreachable': 'warn',
    'no-irregular-whitespace': 'warn',
    'jasmine/no-focused-tests': 'warn',
    'quotes': ['warn', 'single'],
    // enforces spacing between keys and values in object literal properties
    'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
    // enforce consistent spacing before and after keywords (keyword-spacing)
    'keyword-spacing': ['warn', {
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
      'warn', {
        'max': 1,
        'maxEOF': 0 
      }
    ],
    //require or disallow semicolons
    'semi': ['warn', 'always'],
    // opening curly brace of a block is placed on the same line as its corresponding statement or declaration
    'brace-style': 'warn',
    // Allow empty functions
    //note you must disable the base rule as it can report incorrect errors
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': [
      'warn',
      {
        'allow': ['constructors', 'arrowFunctions']
      }
    ],
    '@typescript-eslint/no-this-alias': [
      'warn',
      {
        'allowDestructuring': true, // Allow `const { props, state } = this`; false by default
        'allowedNames': ['self', 'dvm'] // Allow `const self = this`; `[]` by default
      }
    ]

  },
};
