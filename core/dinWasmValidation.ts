/**
 * Lazy loader for din-core `din-wasm` (wasm-pack web target). Matches din-core validation diagnostics.
 */
import { dinDocumentValidateJson, initSync, WasmDinDocumentHandle } from 'din-wasm';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface DinCoreValidationReport {
    accepted: boolean;
    issues: Array<{ code: string; message: string; path?: string }>;
}

let wasmInitialized = false;

function resolveWasmBytes(): Uint8Array {
    const here = dirname(fileURLToPath(import.meta.url));
    const wasmPath = join(here, '../vendor/din-wasm-pkg/din_wasm_bg.wasm');
    return new Uint8Array(readFileSync(wasmPath));
}

function ensureWasmSync(): void {
    if (!wasmInitialized) {
        const bytes = resolveWasmBytes();
        initSync({ module: bytes });
        wasmInitialized = true;
    }
}

/**
 * Initialize the din-core WASM module once (sync init for Node/vitest; browser code should use default `init()` with fetch).
 */
export function ensureDinWasmLoaded(): Promise<void> {
    ensureWasmSync();
    return Promise.resolve();
}

/**
 * Validate UTF-8 DinDocument JSON using din-core semantics (same as `din_document_validate_json` in Rust).
 */
export async function validateDinDocumentWithCore(json: string): Promise<DinCoreValidationReport> {
    ensureWasmSync();
    const raw = dinDocumentValidateJson(json) as { accepted?: boolean; issues?: DinCoreValidationReport['issues'] };
    if (raw && typeof raw.accepted === 'boolean') {
        return {
            accepted: raw.accepted,
            issues: Array.isArray(raw.issues) ? raw.issues : [],
        };
    }
    // `serde_json::Value` via serde-wasm-bindgen may deserialize as an empty object; fall back to handle ctor.
    try {
        const handle = new WasmDinDocumentHandle(json);
        handle.dispose();
        return { accepted: true, issues: [] };
    } catch {
        return { accepted: false, issues: [{ code: 'INVALID_DOCUMENT', message: 'DinDocument validation rejected JSON' }] };
    }
}
