'use strict';

module.exports = {
  extends: [
    'airbnb',
    'prettier',
    'prettier/react',
    'plugin:prettier/recommended'
  ],
  plugins: [
    'react-hooks'
  ],
  parser: 'babel-eslint',
  env: {
    browser: true,
    es6: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 8,
    ecmaFeatures: {
      jsx: true,
      modules: true,
      experimentalObjectRestSpread: true,
    },
  },
  rules: {
    'no-console': 'off',
    strict: ['error', 'global'],
    curly: 'warn',
    'react/jsx-filename-extension': [1, { 'extensions': ['.js', '.jsx'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['draft'] }],
  }
}