import type { Edge, Node } from '@xyflow/react';
import { migratePatchDocument, patchToGraphDocument, type PatchDocument } from '@open-din/react/patch';
import type { AudioNodeData } from '../store';
import westcoastGfunk64PatchJson from './westcoast-gfunk-64.patch.json?raw';

export interface EditorTemplateGraph {
    nodes: Node<AudioNodeData>[];
    edges: Edge[];
}

export const westcoastGfunk64Patch = migratePatchDocument(
    JSON.parse(westcoastGfunk64PatchJson) as PatchDocument
);

export function createWestcoastGfunk64Template(): EditorTemplateGraph {
    const graph = patchToGraphDocument(westcoastGfunk64Patch);
    return {
        nodes: graph.nodes as Node<AudioNodeData>[],
        edges: graph.edges as Edge[],
    };
}
