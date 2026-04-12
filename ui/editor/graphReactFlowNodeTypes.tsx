/**
 * Maps Studio catalog node `name` → React Flow `type` (`${name}Node`) and dynamic view.
 * React Flow registrations are built only from {@link loadStudioNodeCatalog} (built-in YAML + JSON).
 */
import type { NodeTypes } from '@xyflow/react';
import type { EditorNodeType } from './nodeCatalog';
import { loadStudioNodeCatalog, resolveStudioCustomComponentKey } from './nodeCatalog/catalog';
import { STUDIO_NODE_CUSTOM_VIEWS } from './nodeCustomViews/registry';
import { createDynamicNode } from './nodes/DynamicNode';

/** XYFlow `node.type` string used in persisted graphs (`gain` → `gainNode`). */
export function editorTypeToReactFlowType(editorType: EditorNodeType): string {
    return `${editorType}Node`;
}

/**
 * React Flow `nodeTypes` for every row in the Studio catalog.
 */
export function buildReactFlowNodeTypesFromStudioCatalog(): NodeTypes {
    const out: NodeTypes = {};
    for (const def of loadStudioNodeCatalog()) {
        const editorType = def.name as EditorNodeType;
        const key = resolveStudioCustomComponentKey(def);
        const Custom = key ? STUDIO_NODE_CUSTOM_VIEWS[key] : undefined;
        out[editorTypeToReactFlowType(editorType)] = (Custom ?? createDynamicNode(def)) as NodeTypes[string];
    }
    return out;
}
