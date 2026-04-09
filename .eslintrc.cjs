module.exports = {
    root: true,
    env: { browser: true, es2021: true },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
    },
    plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh', 'jsdoc'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    ignorePatterns: ['dist'],
    rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        // Editor and codegen use `any` at boundaries; prefer TypeDoc + types over blanket refactors here.
        '@typescript-eslint/no-explicit-any': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
        ],
        'no-constant-condition': ['error', { checkLoops: false }],
    },
    overrides: [
        {
            files: ['ui/**/*.{ts,tsx}'],
            rules: {
                'jsdoc/require-jsdoc': [
                    'warn',
                    {
                        publicOnly: true,
                        require: {
                            FunctionDeclaration: true,
                            ClassDeclaration: true,
                            MethodDefinition: true,
                            ArrowFunctionExpression: false,
                        },
                    },
                ],
                'jsdoc/require-description': ['warn', { contexts: ['any'] }],
                'jsdoc/require-param-description': 'warn',
                'jsdoc/require-returns-description': 'warn',
            },
        },
    ],
};
