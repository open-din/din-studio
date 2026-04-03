import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const rendererPort = process.env.DIN_EDITOR_APP_PORT ?? '5174';
const rendererHost = process.env.DIN_EDITOR_APP_HOST ?? '127.0.0.1';
const rendererUrl = `http://${rendererHost}:${rendererPort}`;
const electronMainPath = resolve(cwd, 'dist/app/main/main.js');
const electronBinary = resolve(cwd, 'node_modules/electron/cli.js');

let shuttingDown = false;
let electronProcess = null;

const children = [
    spawn(process.execPath, [
        resolve(cwd, 'node_modules/vite/bin/vite.js'),
        '--config',
        'targets/app/vite.config.ts',
        '--host',
        rendererHost,
        '--port',
        rendererPort,
    ], {
        cwd,
        stdio: 'inherit',
    }),
    spawn(process.execPath, [
        resolve(cwd, 'node_modules/typescript/bin/tsc'),
        '-p',
        'targets/app/tsconfig.json',
        '--watch',
        '--preserveWatchOutput',
    ], {
        cwd,
        stdio: 'inherit',
    }),
];

function wait(ms) {
    return new Promise((resolvePromise) => {
        setTimeout(resolvePromise, ms);
    });
}

function isRendererReady() {
    return new Promise((resolvePromise) => {
        const req = httpRequest(rendererUrl, (res) => {
            res.resume();
            resolvePromise((res.statusCode ?? 500) < 500);
        });
        req.on('error', () => resolvePromise(false));
        req.setTimeout(1000, () => {
            req.destroy();
            resolvePromise(false);
        });
        req.end();
    });
}

async function waitForAppReady() {
    while (!shuttingDown) {
        if (existsSync(electronMainPath) && await isRendererReady()) {
            return;
        }
        await wait(250);
    }
}

function shutdown(signal = 'SIGTERM') {
    if (shuttingDown) return;
    shuttingDown = true;

    if (electronProcess && !electronProcess.killed) {
        electronProcess.kill(signal);
    }

    for (const child of children) {
        if (!child.killed) {
            child.kill(signal);
        }
    }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

for (const child of children) {
    child.on('exit', (code) => {
        if (!shuttingDown) {
            shutdown('SIGTERM');
            process.exitCode = code ?? 1;
        }
    });
    child.on('error', (error) => {
        if (!shuttingDown) {
            console.error(error);
            shutdown('SIGTERM');
            process.exitCode = 1;
        }
    });
}

await waitForAppReady();

if (!shuttingDown) {
    electronProcess = spawn(process.execPath, [
        electronBinary,
        electronMainPath,
    ], {
        cwd,
        env: {
            ...process.env,
            DIN_EDITOR_APP_DEV_URL: rendererUrl,
        },
        stdio: 'inherit',
    });

    electronProcess.on('exit', (code) => {
        if (!shuttingDown) {
            shutdown('SIGTERM');
            process.exitCode = code ?? 0;
        }
    });
    electronProcess.on('error', (error) => {
        if (!shuttingDown) {
            console.error(error);
            shutdown('SIGTERM');
            process.exitCode = 1;
        }
    });
}

await Promise.all(children.map((child) => new Promise((resolvePromise) => {
    child.on('exit', () => resolvePromise());
})));
