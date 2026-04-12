/**
 * Browser-compatible Faust runtime initializer.
 *
 * Lazy-loads libfaust WASM from public/faustwasm/ and vends a singleton
 * { compiler, generator } used by useFaustDsp for live DSP compilation.
 *
 * The WASM files must be present in public/faustwasm/ — run `npm run setup:faust`
 * after install if they are missing.
 */
import type { IFaustCompiler, FaustMonoDspGenerator as IFaustMonoDspGenerator } from '@grame/faustwasm';

export interface FaustBrowserRuntime {
    compiler: IFaustCompiler;
    generator: IFaustMonoDspGenerator;
}

let _runtimePromise: Promise<FaustBrowserRuntime> | null = null;

/**
 * Returns the singleton Faust compiler + generator.
 * The first call downloads and instantiates libfaust WASM (~17 MB).
 * Subsequent calls resolve immediately from cache.
 */
export function getFaustRuntime(): Promise<FaustBrowserRuntime> {
    if (!_runtimePromise) {
        _runtimePromise = (async () => {
            const {
                instantiateFaustModuleFromFile,
                FaustCompiler,
                LibFaust,
                FaustMonoDspGenerator,
            } = await import('@grame/faustwasm');

            const mod = await instantiateFaustModuleFromFile(
                '/faustwasm/libfaust-wasm.js',
                '/faustwasm/libfaust-wasm.data',
                '/faustwasm/libfaust-wasm.wasm',
            );

            const lib = new LibFaust(mod);
            const compiler = new FaustCompiler(lib);
            const generator = new FaustMonoDspGenerator();

            return { compiler, generator } as FaustBrowserRuntime;
        })();

        // Don't let an init failure permanently poison the singleton
        _runtimePromise.catch(() => {
            _runtimePromise = null;
        });
    }

    return _runtimePromise;
}
