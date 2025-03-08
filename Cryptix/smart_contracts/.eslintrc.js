module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        semi: true,
        trailingComma: 'es5',
      },
    ],
    'max-len': ['warn', { code: 100, ignoreComments: true, ignoreStrings: true }],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': ['error', 'always'],
    'quote-props': ['error', 'as-needed'],
    'no-duplicate-imports': 'error',
    'no-template-curly-in-string': 'error',
    'prefer-template': 'error',
    'require-await': 'error',
    'no-return-await': 'error',
    'no-await-in-loop': 'warn',
    'array-callback-return': 'error',
    'default-param-last': 'error',
    'no-else-return': 'error',
    'no-empty-function': ['error', { allow: ['constructors'] }],
    'no-loop-func': 'error',
    'no-param-reassign': 'error',
    'no-useless-return': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-spread': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'no-useless-constructor': 'error',
    'no-duplicate-class-members': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-rename': 'error',
    'no-this-before-super': 'error',
    'prefer-destructuring': ['error', { object: true, array: false }],
    'prefer-rest-params': 'error',
    'symbol-description': 'error',
    'object-curly-spacing': ['error', 'always'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    }],
  },
  overrides: [
    {
      files: ['scripts/**/*.js', 'test/**/*.js'],
      rules: {
        'no-undef': 'off',
      },
    },
    {
      files: ['hardhat.config.js'],
      rules: {
        'no-process-env': 'off',
      },
    },
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
};
