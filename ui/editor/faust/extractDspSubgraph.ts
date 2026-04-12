import type { Edge, Node } from '@xyflow/react';
import type { AudioNodeData } from '../types';
import { getNodeTaxonomy } from './taxonomy';

/** Primitives implemented by `faustCodegen.ts` (expand as lowering grows). */
export const FAUST_CODEGEN_SUPPORTED_PRIMITIVES = new Set([
    'osc',
    'gain',
    'filter',
    'output',
]);

export interface ExtractedDspNode {
    id: string;
    /** Sanitized Faust-safe id prefix. */
    mangledId: string;
    data: AudioNodeData;
}

export interface ExtractedDspSubgraph {
    nodes: ExtractedDspNode[];
    edges: Edge[];
}

function mangleNodeId(raw: string): string {
    return `n_${raw.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

/**
 * Select studio nodes that participate in Faust lowering and copy incident edges.
 * Excludes transport, timeline, pure UI, and nodes without a codegen primitive mapping.
 */
export function extractDspSubgraph(
    nodes: Node<AudioNodeData>[],
    edges: Edge[]
): ExtractedDspSubgraph {
    const included = new Map<string, ExtractedDspNode>();

    for (const node of nodes) {
        const tax = getNodeTaxonomy(node.data.type);
        const prim = tax.dspPrimitiveKind;
        if (!prim || !FAUST_CODEGEN_SUPPORTED_PRIMITIVES.has(prim)) {
            continue;
        }
        included.set(node.id, {
            id: node.id,
            mangledId: mangleNodeId(node.id),
            data: node.data,
        });
    }

    const idSet = new Set(included.keys());
    const subEdges = edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));

    return {
        nodes: [...included.values()],
        edges: subEdges,
    };
}
