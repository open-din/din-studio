import type { ExtractedDspNode, ExtractedDspSubgraph } from './extractDspSubgraph';
import { getPrimitiveDefinition } from './dspPrimitiveRegistry';
import type { FaustCompileManifest, FaustParamBindingEntry } from './compileManifest';
import type { FilterNodeData, GainNodeData, OscNodeData, OutputNodeData } from '../types';

export interface FaustCodegenResult {
    /** Full Faust program text. */
    faust: string;
    manifest: FaustCompileManifest;
    diagnostics: string[];
}

function sortImportsUnique(imports: string[]): string[] {
    return [...new Set(imports)].sort((a, b) => a.localeCompare(b));
}

function buildLinearChain(nodeIds: string[], subgraph: ExtractedDspSubgraph): ExtractedDspNode[] {
    const byId = new Map(subgraph.nodes.map((n) => [n.id, n]));
    return nodeIds.map((id) => byId.get(id)!).filter(Boolean);
}

/**
 * Compute a single serial chain from the output node backward (MVP: no fan-out/fan-in inside extracted subgraph).
 */
export function orderChainToOutput(subgraph: ExtractedDspSubgraph): string[] | null {
    const output = subgraph.nodes.find((n) => n.data.type === 'output');
    if (!output) {
        return null;
    }

    const incoming = new Map<string, string[]>();
    for (const e of subgraph.edges) {
        const list = incoming.get(e.target) ?? [];
        list.push(e.source);
        incoming.set(e.target, list);
    }

    const chain: string[] = [];
    let cur: string | undefined = output.id;
    const seen = new Set<string>();

    while (cur) {
        if (seen.has(cur)) {
            return null;
        }
        seen.add(cur);
        chain.unshift(cur);
        const preds = incoming.get(cur);
        if (!preds || preds.length === 0) {
            break;
        }
        if (preds.length > 1) {
            return null;
        }
        cur = preds[0];
    }

    return chain;
}

function emitOsc(node: ExtractedDspNode, params: FaustParamBindingEntry[]): { decl: string; ref: string } {
    const d = node.data as OscNodeData;
    const path = `v/${node.mangledId}/frequency`;
    params.push({ nodeId: node.id, paramId: 'frequency', faustPath: path });
    const freq = d.frequency;
    const decl = `${node.mangledId} = os.oscsin(hslider("${path}", ${freq}, 20, 20000, 0.01));`;
    return { decl, ref: node.mangledId };
}

function emitGain(node: ExtractedDspNode, params: FaustParamBindingEntry[]): { decl: string; ref: string } {
    const d = node.data as GainNodeData;
    const path = `v/${node.mangledId}/gain`;
    params.push({ nodeId: node.id, paramId: 'gain', faustPath: path });
    const g = d.gain;
    const decl = `${node.mangledId} = *(hslider("${path}", ${g}, 0, 4, 0.001));`;
    return { decl, ref: node.mangledId };
}

function emitFilter(node: ExtractedDspNode, params: FaustParamBindingEntry[]): { decl: string; ref: string } {
    const d = node.data as FilterNodeData;
    const pathFreq = `v/${node.mangledId}/frequency`;
    params.push({ nodeId: node.id, paramId: 'frequency', faustPath: pathFreq });
    const fc = d.frequency;
    // MVP: fixed order-3 lowpass; Q not mapped yet.
    const decl = `${node.mangledId} = fi.lowpass(3, hslider("${pathFreq}", ${fc}, 20, 20000, 0.01));`;
    return { decl, ref: node.mangledId };
}

function emitOutput(_node: ExtractedDspNode, _params: FaustParamBindingEntry[]): { decl: string; ref: string } {
    const d = _node.data as OutputNodeData;
    const path = `v/${_node.mangledId}/masterGain`;
    _params.push({ nodeId: _node.id, paramId: 'masterGain', faustPath: path });
    // Master gain as final stereo sink control (applied after mono→stereo split).
    const mg = d.masterGain ?? 1;
    const decl = `${_node.mangledId} = *(hslider("${path}", ${mg}, 0, 2, 0.001));`;
    return { decl, ref: _node.mangledId };
}

/**
 * Emit one Faust `process` from an extracted DSP subgraph (deterministic: sorted imports, stable chain order).
 */
export function generateFaustFromSubgraph(subgraph: ExtractedDspSubgraph, graphName: string): FaustCodegenResult {
    const diagnostics: string[] = [];
    const params: FaustParamBindingEntry[] = [];
    const imports: string[] = [];

    const chainIds = orderChainToOutput(subgraph);
    if (!chainIds) {
        diagnostics.push('Faust codegen (MVP) requires exactly one output node and a linear chain.');
        return {
            faust: '',
            manifest: {
                version: 1,
                codegenId: 'din-studio-faust-mvp',
                sampleRateDefault: 48000,
                inputs: 0,
                outputs: 2,
                params: [],
            },
            diagnostics,
        };
    }

    const ordered = buildLinearChain(chainIds, subgraph);
    const decls: string[] = [];
    const parts: string[] = [];

    for (const node of ordered) {
        const prim = node.data.type;
        const def = getPrimitiveDefinition(prim);
        if (def) {
            imports.push(...def.imports);
        }

        if (node.data.type === 'output') {
            const { decl, ref } = emitOutput(node, params);
            decls.push(decl);
            parts.push(ref);
            continue;
        }
        if (node.data.type === 'osc') {
            const { decl, ref } = emitOsc(node, params);
            decls.push(decl);
            parts.push(ref);
        } else if (node.data.type === 'gain') {
            const { decl, ref } = emitGain(node, params);
            decls.push(decl);
            parts.push(ref);
        } else if (node.data.type === 'filter') {
            const { decl, ref } = emitFilter(node, params);
            decls.push(decl);
            parts.push(ref);
        } else {
            diagnostics.push(`Unsupported node in chain: ${node.data.type}`);
        }
    }

    const sortedImports = sortImportsUnique(imports);
    const importBlock = sortedImports.map((lib) => `import("${lib}");`).join('\n');

    const chainExpr = parts.length > 0 ? parts.join(' : ') : '_';
    const processLine = `process = ${chainExpr} <: (_,_);`;

    const faust = [
        `// Generated Faust — ${graphName}`,
        importBlock,
        '',
        ...decls,
        processLine,
        '',
    ].join('\n');

    const manifest: FaustCompileManifest = {
        version: 1,
        codegenId: 'din-studio-faust-mvp',
        sampleRateDefault: 48000,
        inputs: 0,
        outputs: 2,
        params: [...params].sort((a, b) => `${a.nodeId}/${a.paramId}`.localeCompare(`${b.nodeId}/${b.paramId}`)),
    };

    return { faust, manifest, diagnostics };
}
