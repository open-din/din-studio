import type { Edge, Node } from '@xyflow/react';
import type { AudioNodeData } from '../types';
import { extractDspSubgraph } from './extractDspSubgraph';
import { generateFaustFromSubgraph } from './faustCodegen';
import type { FaustCompileManifest } from './compileManifest';

export interface GraphFaustBundle {
    faust: string;
    manifest: FaustCompileManifest;
    diagnostics: string[];
}

/**
 * Full studio graph → extracted subgraph → single-process Faust + manifest.
 */
export function buildFaustBundleFromGraph(
    nodes: Node<AudioNodeData>[],
    edges: Edge[],
    graphName: string
): GraphFaustBundle {
    const sub = extractDspSubgraph(nodes, edges);
    const { faust, manifest, diagnostics } = generateFaustFromSubgraph(sub, graphName);
    return { faust, manifest, diagnostics };
}
