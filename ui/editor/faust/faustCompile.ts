/**
 * Compiles Faust source to WASM factory using `@grame/faustwasm` (libFaust WASM).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { IFaustCompiler } from '@grame/faustwasm';

let compilerPromise: Promise<IFaustCompiler> | null = null;

function libfaustBaseDir(): string {
    const here = dirname(fileURLToPath(import.meta.url));
    return join(here, '../../../node_modules/@grame/faustwasm/libfaust-wasm');
}

async function getCompiler(): Promise<IFaustCompiler> {
    if (!compilerPromise) {
        compilerPromise = (async () => {
            const faustEntry = join(dirname(fileURLToPath(import.meta.url)), '../../../node_modules/@grame/faustwasm/dist/esm/index.js');
            const { instantiateFaustModuleFromFile, FaustCompiler: FC, LibFaust: LF } = await import(pathToFileURL(faustEntry).href);
            const base = libfaustBaseDir();
            // `@grame/faustwasm` uses the browser path when `window` exists; vitest/jsdom stubs fetch. Force the Node/fs branch.
            const prevWindow = globalThis.window;
            Reflect.deleteProperty(globalThis, 'window');
            let mod;
            try {
                mod = await instantiateFaustModuleFromFile(
                    join(base, 'libfaust-wasm.js'),
                    join(base, 'libfaust-wasm.data'),
                    join(base, 'libfaust-wasm.wasm')
                );
            } finally {
                if (prevWindow !== undefined) {
                    (globalThis as { window?: typeof prevWindow }).window = prevWindow;
                }
            }
            const lib = new LF(mod);
            return new FC(lib);
        })();
    }
    return compilerPromise;
}

export interface FaustCompileOk {
    ok: true;
    /** DSP JSON meta from Faust (paths, I/O counts). */
    dspJson: string;
}

export interface FaustCompileErr {
    ok: false;
    error: string;
}

export type FaustCompileResult = FaustCompileOk | FaustCompileErr;

/**
 * Compile Faust program text to a mono DSP WASM factory (async, heavy — prefer workers in UI).
 */
export async function compileFaustDspToWasm(name: string, dspCode: string): Promise<FaustCompileResult> {
    const compiler = await getCompiler();
    console.log('[dsp source]', dspCode);
    const factory = await compiler.createMonoDSPFactory(name, dspCode, '-O1');
    if (!factory) {
        return { ok: false, error: compiler.getErrorMessage() || 'Faust compile failed' };
    }
    return { ok: true, dspJson: factory.json };
}
