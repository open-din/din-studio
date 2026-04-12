#!/usr/bin/env node
/**
 * Copies the libfaust WASM runtime files from node_modules to public/faustwasm/.
 * Run once after `npm install`: npm run setup:faust
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'node_modules/@grame/faustwasm/libfaust-wasm');
const dest = join(root, 'public/faustwasm');

const files = ['libfaust-wasm.js', 'libfaust-wasm.data', 'libfaust-wasm.wasm'];

mkdirSync(dest, { recursive: true });

let copied = 0;
for (const file of files) {
    const srcPath = join(src, file);
    const destPath = join(dest, file);
    if (!existsSync(srcPath)) {
        console.error(`Missing source: ${srcPath}`);
        process.exit(1);
    }
    copyFileSync(srcPath, destPath);
    copied++;
    console.log(`  copied ${file}`);
}

console.log(`\nFaust WASM runtime ready → public/faustwasm/ (${copied} files)`);
