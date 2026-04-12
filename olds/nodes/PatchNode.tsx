import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { graphDocumentToPatch, type PatchDocument } from '@open-din/react/patch';
import {
    getAssetObjectUrl,
    listPatchSources,
    subscribeAssets,
    type ProjectPatchSourceRecord,
} from '../../ui/editor/audioLibrary';
import {
    NodeHandleRow,
    NodeShell,
    NodeValueBadge,
    NodeWidget,
    NodeWidgetTitle,
} from '../../ui/editor/components/NodeShell';
import { getNodeHandleDescriptors } from '../../ui/editor/nodeCatalog';
import { useAudioGraphStore } from '../../ui/editor/store';
import type { InputNodeData, PatchAudioMetadata, PatchNodeData, PatchSlot, PatchSourceKind } from '../../ui/editor/types';
import { validateOfflinePatchText } from '../../core/offline';

const DEFAULT_PATCH_AUDIO: PatchAudioMetadata = {
    input: { id: 'in', label: 'Audio In', type: 'audio' },
    output: { id: 'out', label: 'Audio Out', type: 'audio' },
};

const asPath = (relativePath: string) => {
    const normalized = relativePath.trim();
    if (!normalized) return null;
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const normalizeSlotId = (value: string, fallback: string) => {
    const cleaned = value
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return cleaned || fallback;
};

const dedupeSlots = (slots: PatchSlot[]): PatchSlot[] => {
    const seen = new Set<string>();
    const normalized: PatchSlot[] = [];

    for (const slot of slots) {
        const baseId = normalizeSlotId(String(slot.id ?? ''), 'slot');
        let nextId = baseId;
        let counter = 2;
        while (seen.has(nextId)) {
            nextId = `${baseId}-${counter}`;
            counter += 1;
        }
        seen.add(nextId);
        normalized.push({
            id: nextId,
            label: String(slot.label ?? '').trim() || nextId,
            type: slot.type === 'audio' ? 'audio' : 'midi',
        });
    }

    return normalized;
};

function deriveBoundaryMetadata(
    patch: PatchDocument,
    socketKindByParamId?: Map<string, string>
): {
    patchName: string;
    inputs: PatchSlot[];
    outputs: PatchSlot[];
    audio: PatchAudioMetadata;
} {
    const inputSlots: PatchSlot[] = [
        ...patch.interface.inputs.map((entry) => {
            const socketKind = socketKindByParamId?.get(entry.paramId);
            return {
                id: normalizeSlotId(entry.key || entry.id, `input-${entry.id}`),
                label: entry.label || entry.key || entry.id,
                type: socketKind === 'audio' ? 'audio' as const : 'midi' as const,
            };
        }),
        ...patch.interface.events.map((entry) => ({
            id: normalizeSlotId(entry.key || entry.id, `event-${entry.id}`),
            label: entry.label || entry.key || entry.id,
            type: 'midi' as const,
        })),
        ...patch.interface.midiInputs.map((entry) => ({
            id: normalizeSlotId(entry.key || entry.id, `midi-in-${entry.id}`),
            label: entry.label || entry.key || entry.id,
            type: 'midi' as const,
        })),
    ];

    const outputSlots: PatchSlot[] = patch.interface.midiOutputs.map((entry) => ({
        id: normalizeSlotId(entry.key || entry.id, `midi-out-${entry.id}`),
        label: entry.label || entry.key || entry.id,
        type: 'midi' as const,
    }));

    return {
        patchName: patch.name,
        inputs: dedupeSlots(inputSlots),
        outputs: dedupeSlots(outputSlots),
        audio: DEFAULT_PATCH_AUDIO,
    };
}

const PatchNode = memo(({ id, data, selected }: NodeProps<Node<PatchNodeData>>) => {
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const graphs = useAudioGraphStore((state) => state.graphs);
    const activeGraphId = useAudioGraphStore((state) => state.activeGraphId);
    const [sources, setSources] = useState<ProjectPatchSourceRecord[]>([]);
    const [sourceLoadError, setSourceLoadError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const refreshSources = useCallback(() => {
        listPatchSources()
            .then((records) => {
                setSources(records);
                setSourceLoadError(null);
            })
            .catch(() => {
                setSources([]);
                setSourceLoadError('Unable to list patch sources.');
            });
    }, []);

    useEffect(() => {
        refreshSources();
        return subscribeAssets(refreshSources);
    }, [refreshSources]);

    const availableSources = useMemo(
        () => sources.filter((source) => source.kind !== 'graph' || source.graphId !== activeGraphId),
        [activeGraphId, sources],
    );

    const selectedSource = useMemo(
        () => availableSources.find((source) => source.id === data.patchSourceId) ?? null,
        [availableSources, data.patchSourceId],
    );

    const resolvePatchForSource = useCallback(async (source: ProjectPatchSourceRecord): Promise<PatchDocument> => {
        if (source.kind === 'graph') {
            const graph = graphs.find((entry) => entry.id === source.graphId);
            if (!graph) {
                throw new Error('Selected sibling graph is unavailable.');
            }
            return graphDocumentToPatch(graph as any);
        }

        if (!source.assetId) {
            throw new Error('Selected patch asset is unavailable.');
        }

        const objectUrl = await getAssetObjectUrl(source.assetId);
        if (!objectUrl) {
            throw new Error('Patch asset cache is unavailable.');
        }

        const text = await fetch(objectUrl).then((response) => response.text());
        return validateOfflinePatchText(text).patch;
    }, [graphs]);

    const synchronizeFromSource = useCallback(async (source: ProjectPatchSourceRecord) => {
        setIsSyncing(true);
        try {
            const patch = await resolvePatchForSource(source);

            // For graph sources, build a map of paramId → socketKind so audio/trigger
            // params are exposed with the correct slot type on the patch node.
            const socketKindByParamId = new Map<string, string>();
            if (source.kind === 'graph') {
                const innerGraph = graphs.find((g) => g.id === source.graphId);
                for (const node of innerGraph?.nodes ?? []) {
                    if (node.data?.type === 'input') {
                        for (const param of (node.data as InputNodeData).params ?? []) {
                            if (param.id && param.socketKind) {
                                socketKindByParamId.set(param.id, param.socketKind);
                            }
                        }
                    }
                }
            }

            const boundary = deriveBoundaryMetadata(patch, socketKindByParamId.size > 0 ? socketKindByParamId : undefined);
            const patchSourceKind: PatchSourceKind = source.kind === 'graph' ? 'graph' : 'asset';
            const patchAsset = asPath(source.relativePath);
            updateNodeData(id, {
                patchSourceId: source.id,
                patchSourceKind,
                patchAsset,
                patchName: boundary.patchName,
                patchInline: source.kind === 'graph' ? patch : null,
                inputs: boundary.inputs,
                outputs: boundary.outputs,
                audio: boundary.audio,
                sourceUpdatedAt: source.updatedAt,
                sourceError: null,
            });
            setSourceLoadError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Patch source sync failed.';
            setSourceLoadError(message);
            updateNodeData(id, { sourceError: message });
        } finally {
            setIsSyncing(false);
        }
    }, [id, resolvePatchForSource, updateNodeData]);

    useEffect(() => {
        if (!selectedSource) return;
        if (selectedSource.updatedAt === data.sourceUpdatedAt && !data.sourceError) return;
        void synchronizeFromSource(selectedSource);
    }, [data.sourceError, data.sourceUpdatedAt, selectedSource, synchronizeFromSource]);

    const handleSourceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const sourceId = event.target.value;
        if (!sourceId) {
            updateNodeData(id, {
                patchSourceId: '',
                patchSourceKind: null,
                patchAsset: null,
                patchName: '',
                patchInline: null,
                inputs: [],
                outputs: [],
                audio: DEFAULT_PATCH_AUDIO,
                sourceUpdatedAt: 0,
                sourceError: null,
            });
            setSourceLoadError(null);
            return;
        }

        const source = availableSources.find((entry) => entry.id === sourceId);
        if (!source) return;
        void synchronizeFromSource(source);
    }, [availableSources, id, synchronizeFromSource, updateNodeData]);

    const handles = getNodeHandleDescriptors(data);
    const targetHandles = handles.filter((handle) => handle.direction === 'target');
    const sourceHandles = handles.filter((handle) => handle.direction === 'source');
    const statusText = data.sourceError || sourceLoadError
        ? 'error'
        : data.patchSourceId
            ? 'linked'
            : 'empty';

    return (
        <NodeShell
            nodeType="patch"
            title={data.label?.trim() || 'Patch'}
            selected={selected}
            badge={<NodeValueBadge>{statusText}</NodeValueBadge>}
        >
            <NodeWidget title={<NodeWidgetTitle icon="patch">Patch source</NodeWidgetTitle>}>
                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Source</span>
                    <select
                        className="node-shell__field"
                        value={data.patchSourceId}
                        onChange={handleSourceChange}
                        title="Select patch source"
                    >
                        <option value="">Select source</option>
                        {availableSources.map((source) => (
                            <option key={source.id} value={source.id}>
                                {source.kind === 'graph' ? `Graph · ${source.name}` : `Asset · ${source.name}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <NodeValueBadge live={Boolean(data.patchName)}>{data.patchName || 'No source selected'}</NodeValueBadge>
                    {data.patchAsset ? <NodeValueBadge>{data.patchAsset}</NodeValueBadge> : null}
                    {isSyncing ? <NodeValueBadge live>syncing</NodeValueBadge> : null}
                    {sourceLoadError ? <NodeValueBadge>{sourceLoadError}</NodeValueBadge> : null}
                </div>
            </NodeWidget>

            {targetHandles.map((handle) => (
                <NodeHandleRow
                    key={`target-${handle.id}`}
                    direction="target"
                    handleId={handle.id}
                    label={handle.label}
                    handleKind={handle.id === 'in' || /^in\d+$/.test(handle.id) ? 'audio' : 'control'}
                />
            ))}
            {sourceHandles.map((handle) => (
                <NodeHandleRow
                    key={`source-${handle.id}`}
                    direction="source"
                    handleId={handle.id}
                    label={handle.label}
                    handleKind={handle.id === 'out' || /^out\d+$/.test(handle.id) ? 'audio' : 'control'}
                />
            ))}
        </NodeShell>
    );
});

PatchNode.displayName = 'PatchNode';
export default PatchNode;
