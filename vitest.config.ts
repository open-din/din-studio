import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
    resolve: {
        alias: [
            { find: /.*\/AudioEngine$/, replacement: resolve(__dirname, './ui/editor/AudioEngine.stub.ts') },
            // `file:../react-din` can nest its own react/react-dom; alias to the app copy for a single React instance.
            { find: 'react', replacement: resolve(__dirname, 'node_modules/react') },
            { find: 'react-dom', replacement: resolve(__dirname, 'node_modules/react-dom') },
            { find: 'react/jsx-runtime', replacement: resolve(__dirname, 'node_modules/react/jsx-runtime') },
        ],
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tests/unit/**/*.spec.ts', 'tests/unit/**/*.spec.tsx'],
        setupFiles: [resolve(__dirname, './vitest.setup.ts')],
    },
});
