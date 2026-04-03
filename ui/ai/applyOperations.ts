import { useAudioGraphStore } from '../editor/store';
import type { EditorOperation } from '../../core/types';

export interface ApplyResult {
    applied: number;
    idMap: Record<string, string>;
}

export function applyOperations(operations: EditorOperation[]): ApplyResult {
    const idMap: Record<string, string> = {};
    let applied = 0;

    for (const op of operations) {
        try {
            const store = useAudioGraphStore.getState();

            if (op.type === 'add_node') {
                const beforeIds = new Set(store.nodes.map((n) => n.id));
                store.addNode(op.nodeType, op.position);
                const afterNodes = useAudioGraphStore.getState().nodes;
                const newNode = afterNodes.find((n) => !beforeIds.has(n.id));
                if (newNode && op.nodeId) {
                    idMap[op.nodeId] = newNode.id;
                }
                applied++;

            } else if (op.type === 'connect') {
                const source = idMap[op.source] ?? op.source;
                const target = idMap[op.target] ?? op.target;
                store.onConnect({
                    source,
                    target,
                    sourceHandle: op.sourceHandle ?? null,
                    targetHandle: op.targetHandle ?? null,
                });
                applied++;

            } else if (op.type === 'disconnect') {
                const source = op.source ? (idMap[op.source] ?? op.source) : undefined;
                const target = op.target ? (idMap[op.target] ?? op.target) : undefined;
                const edge = store.edges.find((e) =>
                    (!op.edgeId || e.id === op.edgeId) &&
                    (!source || e.source === source) &&
                    (!target || e.target === target) &&
                    (!op.sourceHandle || e.sourceHandle === op.sourceHandle) &&
                    (!op.targetHandle || e.targetHandle === op.targetHandle)
                );
                if (edge) {
                    store.onEdgesChange([{ type: 'remove', id: edge.id }]);
                    applied++;
                }

            } else if (op.type === 'update_node_data') {
                const nodeId = idMap[op.nodeId] ?? op.nodeId;
                store.updateNodeData(nodeId, op.data);
                applied++;

            } else if (op.type === 'remove_node') {
                const nodeId = idMap[op.nodeId] ?? op.nodeId;
                store.removeNode(nodeId);
                applied++;

            } else if (op.type === 'create_graph') {
                const graph = store.createGraph(op.name);
                if (op.activate !== false) {
                    store.setActiveGraph(graph.id);
                }
                applied++;

            } else if (op.type === 'load_graph') {
                store.loadGraph(op.nodes, op.edges);
                applied++;
            }
        } catch {
            // Skip failed operations silently
        }
    }

    return { applied, idMap };
}
