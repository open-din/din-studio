import { memo, useMemo, type ComponentType, type ReactNode } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import {
    NodeCheckboxField,
    NodeHandleRow,
    NodeNumberField,
    NodeShell,
    NodeValueBadge,
    type NodeHandleKind,
} from '../components/NodeShell';
import { audioEngine } from '../AudioEngine';
import { getNodeCatalogEntry, getNodeHandleDescriptors } from '../nodeCatalog';
import { descriptorToHandleKind } from '../nodeCatalog/portHandleKind';
import type { StudioNodeDefinition } from '../nodeCatalog/definition';
import type { HandleDescriptor } from '../nodeCatalog/types';
import type { AudioNodeData } from '../types';
import type { EditorNodeType } from '../nodeCatalog';
import { formatConnectedDisplay, useTargetHandleConnection } from '../paramConnections';
import { useAudioGraphStore } from '../store';
import { inferHandleKind } from './inferHandleKind';

type EditorNodeFC = ComponentType<NodeProps<Node<AudioNodeData>>>;

function resolveRowHandleKind(
    descriptor: HandleDescriptor,
    nodeType: EditorNodeType,
    direction: 'source' | 'target',
): NodeHandleKind {
    return (descriptorToHandleKind(descriptor) ?? inferHandleKind(nodeType, descriptor.id, direction)) as NodeHandleKind;
}

function DynamicTargetHandleRow({
    nodeId,
    nodeType,
    nodeData,
    descriptor,
}: {
    nodeId: string;
    nodeType: EditorNodeType;
    nodeData: AudioNodeData;
    descriptor: HandleDescriptor;
}) {
    const connection = useTargetHandleConnection(nodeId, descriptor.id);
    const updateNodeData = useAudioGraphStore((s) => s.updateNodeData);
    const kind = resolveRowHandleKind(descriptor, nodeType, 'target');
    const pv = descriptor.portValueType;
    const pi = descriptor.portInterface;

    const applyPatch = (patch: Partial<AudioNodeData>) => {
        updateNodeData(nodeId, patch);
        audioEngine.updateNode(nodeId, patch);
    };

    if (pv == null || pv === 'audio' || pv === 'trigger') {
        return (
            <NodeHandleRow
                direction="target"
                label={descriptor.label}
                handleId={descriptor.id}
                handleKind={kind}
            />
        );
    }

    const raw = (nodeData as Record<string, unknown>)[descriptor.id];
    let control: ReactNode = null;

    if (pv === 'bool' && pi === 'checkbox') {
        control = connection.connected ? (
            <NodeValueBadge live className="node-shell__row-field">
                {formatConnectedDisplay(connection.value, 'bool')}
            </NodeValueBadge>
        ) : (
            <NodeCheckboxField
                checked={Boolean(raw)}
                onChange={(checked) => applyPatch({ [descriptor.id]: checked } as Partial<AudioNodeData>)}
                className="node-shell__row-field"
            />
        );
    } else if ((pv === 'int' || pv === 'float') && (pi === 'input' || pi === 'slider')) {
        control = connection.connected ? (
            <NodeValueBadge live className="node-shell__row-field">
                {formatConnectedDisplay(connection.value, pv)}
            </NodeValueBadge>
        ) : (
            <NodeNumberField
                value={typeof raw === 'number' && Number.isFinite(raw) ? raw : 0}
                step={pv === 'int' ? 1 : 0.01}
                onChange={(v) => applyPatch({ [descriptor.id]: v } as Partial<AudioNodeData>)}
                className="node-shell__row-field"
            />
        );
    }

    if (!control) {
        return (
            <NodeHandleRow
                direction="target"
                label={descriptor.label}
                handleId={descriptor.id}
                handleKind={kind}
            />
        );
    }

    return (
        <NodeHandleRow
            direction="target"
            label={descriptor.label}
            handleId={descriptor.id}
            handleKind={kind}
            control={control}
        />
    );
}

/**
 * Generic React Flow node view for every catalog row: YAML drives handles via {@link getNodeHandleDescriptors}.
 */
export function createDynamicNode(def: StudioNodeDefinition): EditorNodeFC {
    const nodeType = def.name as EditorNodeType;
    const Component = memo((props: NodeProps<Node<AudioNodeData>>) => {
        const { id, data, selected } = props;
        const nodeData = data as AudioNodeData;
        const handles = useMemo(() => getNodeHandleDescriptors(nodeData), [nodeData]);
        const sourceHandles = handles.filter((h) => h.direction === 'source');
        const targetHandles = handles.filter((h) => h.direction === 'target');
        const title =
            nodeData.label?.trim()
            || def.label?.trim()
            || getNodeCatalogEntry(nodeType).label;

        return (
            <NodeShell nodeType={nodeType} title={title} selected={selected}>
                {sourceHandles.map((descriptor) => (
                    <NodeHandleRow
                        key={`${id}-src-${descriptor.id}`}
                        direction="source"
                        label={descriptor.label}
                        handleId={descriptor.id}
                        handleKind={resolveRowHandleKind(descriptor, nodeData.type, 'source')}
                    />
                ))}
                {targetHandles.map((descriptor) => (
                    <DynamicTargetHandleRow
                        key={`${id}-tgt-${descriptor.id}`}
                        nodeId={id}
                        nodeType={nodeData.type}
                        nodeData={nodeData}
                        descriptor={descriptor}
                    />
                ))}
            </NodeShell>
        );
    });
    Component.displayName = `DynamicNode(${def.name})`;
    return Component as unknown as EditorNodeFC;
}
