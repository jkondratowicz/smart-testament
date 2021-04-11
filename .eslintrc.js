module.exports = {
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
  },
  extends: ['plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    es6: true,
  },
  rules: {
    'prettier/prettier': [
      'warn',
      {
        singleQuote: true,
        semi: true,
      },
    ],
  },
};
