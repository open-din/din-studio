import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const env = {
    ...process.env,
    DIN_STUDIO_MCP_BRIDGE_PORT: process.env.DIN_STUDIO_MCP_BRIDGE_PORT ?? '17374',
    VITE_DIN_STUDIO_MCP_BRIDGE_PORT: process.env.VITE_DIN_STUDIO_MCP_BRIDGE_PORT ?? '17374',
};
const children = [
    spawn('npm', ['run', 'dev:mcp'], { cwd, env, stdio: 'inherit' }),
    spawn('npm', ['run', 'dev:web'], { cwd, env, stdio: 'inherit' }),
];

let shuttingDown = false;

function shutdown(signal = 'SIGTERM') {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of children) {
        if (!child.killed) {
            child.kill(signal);
        }
    }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

await Promise.all(children.map((child) => new Promise((resolvePromise, reject) => {
    child.on('exit', (code) => {
        if (!shuttingDown) {
            shutdown('SIGTERM');
        }
        if (code === 0 || code === null) {
            resolvePromise();
            return;
        }
        reject(new Error(`Child process exited with code ${code}.`));
    });
    child.on('error', reject);
})));
