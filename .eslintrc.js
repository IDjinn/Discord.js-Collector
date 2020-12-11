module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
    },
    extends: [
        'airbnb-base',
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        'linebreak-style': 'off',
        'no-unused-vars': 'off',
        indent: ['error', 4],
        'max-classes-per-file': 'off',
        'no-underscore-dangle': 'off',
        'max-len': ['error', 160],
        'consistent-return': 'off',
        'no-async-promise-executor': 'off',
        'global-require': 'off',
        'no-continue': 'off',
        'no-await-in-loop': 'off',
    },
};
