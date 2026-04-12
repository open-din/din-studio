/**
 * Host-facing compile manifest for Faust parameters (`v2/specs/06-params-binding.md`, `10-runtime-bridge.md`).
 */

export interface FaustParamBindingEntry {
    nodeId: string;
    paramId: string;
    /** Faust UI path segment emitted by codegen (vslider/vknob group). */
    faustPath: string;
}

export interface FaustCompileManifest {
    version: 1;
    codegenId: string;
    sampleRateDefault: number;
    inputs: number;
    outputs: number;
    params: FaustParamBindingEntry[];
}

export function serializeCompileManifest(manifest: FaustCompileManifest): string {
    return `${JSON.stringify(manifest, null, 2)}\n`;
}
