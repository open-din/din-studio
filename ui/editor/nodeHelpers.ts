/**
 * @file Connection rules, node normalization, and graph migration helpers for the editor.
 * API surface is mirrored in `docs/generated` after `npm run docs:generate`.
 */
/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns-description -- many small predicates; prefer generated API docs */

import type { Edge, Node } from '@xyflow/react';
import type {
    AudioNodeData,
    InputNodeData,
    InputParam,
    MidiInMapping,
    MidiNoteNodeData,
    OutputNodeData,
    OutputParam,
    TransportNodeData,
    UiTokensNodeData,
} from './types';
import { getInputParamHandleId, migrateLegacyInputHandle } from './handleIds';
import {
    getEditorNodeCatalog,
    getNodeCatalogEntry,
    getNodeHandleDescriptors,
    type HandleDescriptor,
    type HandleDirection,
    type EditorNodeType,
} from './nodeCatalog';
import { getStudioNodeDefinition } from './nodeCatalog/catalog';
import { resolveStudioPortsForInstance } from './nodeCatalog/handles';
import type { StudioNodePortValueType } from './nodeCatalog/definition';
import { createEditorNode } from './graphBuilders';
import {
    hasAnyUiTokenInputParam,
    isLegacyUiTokensInputLabel,
    normalizeUiTokensNodeData,
} from './uiTokens';

export {
    INPUT_PARAM_HANDLE_PREFIX,
    getInputParamHandleId,
    migrateLegacyInputHandle,
    resolveInputParamByHandle,
} from './handleIds';

export interface GraphConnectionLike {
    source?: string | null;
    sourceHandle?: string | null;
    target?: string | null;
    targetHandle?: string | null;
}

export interface ConnectionAssistStart {
    nodeId: string;
    handleId: string | null;
    handleType: HandleDirection;
}

export interface NormalizedConnectionDescriptor {
    source: string;
    sourceHandle?: string | null;
    target: string;
    targetHandle?: string | null;
}

export interface CompatibleHandleMatch {
    key: string;
    nodeId: string;
    nodeType: EditorNodeType;
    nodeLabel: string;
    handleId: string;
    handleLabel: string;
    handleType: HandleDirection;
    connection: NormalizedConnectionDescriptor;
}

export interface NodeSuggestion extends CompatibleHandleMatch {
    type: EditorNodeType;
    icon: string;
    color: string;
    title: string;
}

const AUDIO_NODE_TYPES = new Set<AudioNodeData['type']>([
    'osc',
    'gain',
    'filter',
    'delay',
    'reverb',
    'compressor',
    'phaser',
    'flanger',
    'tremolo',
    'eq3',
    'distortion',
    'chorus',
    'noiseBurst',
    'waveShaper',
    'convolver',
    'analyzer',
    'panner3d',
    'panner',
    'mixer',
    'auxSend',
    'auxReturn',
    'matrixMixer',
    'noise',
    'constantSource',
    'mediaStream',
    'patch',
    'sampler',
    'output',
]);

const DATA_NODE_TYPES = new Set<AudioNodeData['type']>([
    'math',
    'compare',
    'mix',
    'clamp',
    'switch',
]);

const TRANSPORT_TARGET_TYPES = new Set<AudioNodeData['type']>([
    'stepSequencer',
    'pianoRoll',
    'midiPlayer',
]);

const TRIGGER_SOURCE_TYPES = new Set<AudioNodeData['type']>([
    'stepSequencer',
    'pianoRoll',
    'eventTrigger',
    'midiNote',
    'midiPlayer',
]);

const SINGLETON_NODE_TYPES = new Set(
    getEditorNodeCatalog()
        .filter((node) => node.singleton)
        .map((node) => node.type)
);

export function isAudioNodeType(type: AudioNodeData['type']): boolean {
    return AUDIO_NODE_TYPES.has(type);
}

export function isDataNodeType(type: AudioNodeData['type']): boolean {
    return DATA_NODE_TYPES.has(type);
}

export function isInputLikeNodeType(type: AudioNodeData['type']): type is 'input' | 'uiTokens' {
    return type === 'input' || type === 'uiTokens';
}

export function createInputParamId(nodeId: string, index: number): string {
    return `${nodeId}-param-${index + 1}`;
}

const INPUT_PARAM_VALUE_KINDS = new Set<InputParam['type']>([
    'float',
    'int',
    'range',
    'audio',
    'trigger',
    'event',
]);

function socketKindFromParamType(type: InputParam['type']): 'audio' | 'control' | 'trigger' {
    if (type === 'audio') return 'audio';
    if (type === 'trigger' || type === 'event') return 'trigger';
    return 'control';
}

function normalizeInputParamType(param: Partial<InputParam>): InputParam['type'] {
    const sk = param.socketKind;
    if (sk === 'audio') return 'audio';
    if (sk === 'trigger') return 'trigger';
    const raw = param.type;
    if (raw && INPUT_PARAM_VALUE_KINDS.has(raw)) {
        return raw;
    }
    return 'float';
}

function isValidAudioSource(v: unknown): v is NonNullable<InputParam['audioSource']> {
    return v === 'mic' || v === 'file' || v === 'none';
}

export function ensureInputParam(param: Partial<InputParam>, nodeId: string, index: number): InputParam {
    const fallbackName = param.name?.trim() || param.label?.trim() || `Param ${index + 1}`;
    const pType = normalizeInputParamType(param);
    const defaultValue = Number.isFinite(param.defaultValue) ? Number(param.defaultValue) : Number(param.value ?? 0);
    const value = Number.isFinite(param.value) ? Number(param.value) : defaultValue;
    const min = Number.isFinite(param.min) ? Number(param.min) : 0;
    const max = Number.isFinite(param.max) ? Number(param.max) : 1;
    const stepRaw = param.step;
    const step = Number.isFinite(stepRaw) ? Number(stepRaw) : pType === 'int' ? 1 : 0.01;

    const socketKind = socketKindFromParamType(pType);

    const audioSource: InputParam['audioSource'] | undefined =
        pType === 'audio'
            ? isValidAudioSource(param.audioSource)
                ? param.audioSource
                : 'none'
            : undefined;

    const base: InputParam = {
        id: param.id?.trim() || createInputParamId(nodeId, index),
        name: fallbackName,
        type: pType,
        defaultValue,
        value,
        min,
        max,
        label: param.label?.trim() || fallbackName,
        socketKind,
    };

    if (pType === 'float' || pType === 'int' || pType === 'range') {
        return { ...base, step };
    }
    if (pType === 'audio') {
        return { ...base, audioSource };
    }
    return base;
}

export function normalizeInputNodeData(nodeId: string, data: InputNodeData): InputNodeData {
    return {
        type: 'input',
        params: Array.isArray(data.params)
            ? data.params.map((param, index) => ensureInputParam(param, nodeId, index))
            : [],
        label: data.label?.trim() || 'Input',
    };
}

export function normalizeOutputNodeData(data: OutputNodeData): OutputNodeData {
    const validKinds = ['audio', 'control', 'trigger'] as const;
    const outputParams = Array.isArray(data.outputParams)
        ? data.outputParams.map((p, i): OutputParam => ({
            id: p.id?.trim() || `out-param-${i}`,
            name: p.name?.trim() || `Output ${i + 1}`,
            label: p.label?.trim() || p.name?.trim() || `Output ${i + 1}`,
            socketKind: validKinds.includes(p.socketKind as (typeof validKinds)[number])
                ? (p.socketKind as (typeof validKinds)[number])
                : 'audio',
        }))
        : undefined;

    return {
        type: 'output',
        playing: Boolean(data.playing),
        masterGain: Number.isFinite(data.masterGain) ? data.masterGain : 0.5,
        label: data.label?.trim() || 'Output',
        ...(outputParams !== undefined ? { outputParams } : {}),
    };
}

export function getInputParamHandleIdByIndex(params: InputParam[], index: number): string | null {
    const param = params[index];
    return param ? getInputParamHandleId(param) : null;
}

export function normalizeTransportNodeData(data: TransportNodeData): TransportNodeData {
    const normalizePositive = (value: number | undefined, fallback: number) =>
        Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    return {
        type: 'transport',
        bpm: normalizePositive(data.bpm, 120),
        playing: Boolean(data.playing),
        beatsPerBar: normalizePositive(data.beatsPerBar, 4),
        beatUnit: normalizePositive(data.beatUnit, 4),
        stepsPerBeat: normalizePositive(data.stepsPerBeat, 4),
        barsPerPhrase: normalizePositive(data.barsPerPhrase, 4),
        swing: Number.isFinite(data.swing) ? clamp(Number(data.swing), 0, 1) : 0,
        label: data.label?.trim() || 'Transport',
    };
}

const isMidiInputSelection = (value: unknown): value is MidiNoteNodeData['inputId'] =>
    value === 'default' || value === 'all' || (typeof value === 'string' && value.length > 0);

const clampMidiNote = (value: unknown, fallback: number) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(127, Math.round(numeric)));
};

const normalizeMidiChannel = (value: unknown): MidiNoteNodeData['channel'] => {
    if (value === 'all') return 'all';
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 'all';
    const rounded = Math.round(numeric);
    return rounded >= 1 && rounded <= 16 ? rounded : 'all';
};

const normalizeMidiInMapping = (mapping: unknown): MidiInMapping | null => {
    if (!mapping || typeof mapping !== 'object') return null;

    const candidate = mapping as Partial<MidiInMapping>;
    if (typeof candidate.inputId !== 'string' || candidate.inputId.length === 0) return null;

    const channel = normalizeMidiChannel(candidate.channel);
    if (channel === 'all') return null;

    return {
        mappingId: typeof candidate.mappingId === 'string' && candidate.mappingId.length > 0
            ? candidate.mappingId
            : `${candidate.inputId}:${channel}`,
        inputId: candidate.inputId,
        inputName: typeof candidate.inputName === 'string' && candidate.inputName.trim().length > 0
            ? candidate.inputName.trim()
            : candidate.inputId,
        channel,
        lastNote: clampMidiNote(candidate.lastNote, 60),
        lastVelocity: Number.isFinite(candidate.lastVelocity) ? Math.max(0, Math.min(1, Number(candidate.lastVelocity))) : 0,
        lastSeenAt: Number.isFinite(candidate.lastSeenAt) ? Number(candidate.lastSeenAt) : 0,
    };
};

export function normalizeMidiNoteNodeData(data: MidiNoteNodeData): MidiNoteNodeData {
    const note = clampMidiNote(data.note, 60);
    const noteMin = clampMidiNote(data.noteMin, 48);
    const noteMax = clampMidiNote(data.noteMax, 72);
    const normalizedMin = Math.min(noteMin, noteMax);
    const normalizedMax = Math.max(noteMin, noteMax);
    const mappings = Array.isArray(data.mappings)
        ? data.mappings
            .map((mapping) => normalizeMidiInMapping(mapping))
            .filter((mapping): mapping is MidiInMapping => mapping !== null)
        : [];
    const activeMappingId = typeof data.activeMappingId === 'string'
        && mappings.some((mapping) => mapping.mappingId === data.activeMappingId)
        ? data.activeMappingId
        : null;

    return {
        type: 'midiNote',
        inputId: isMidiInputSelection(data.inputId) ? data.inputId : 'default',
        channel: normalizeMidiChannel(data.channel),
        noteMode: data.noteMode === 'single' || data.noteMode === 'range' ? data.noteMode : 'all',
        note,
        noteMin: normalizedMin,
        noteMax: normalizedMax,
        mappingEnabled: Boolean(data.mappingEnabled),
        mappings,
        activeMappingId,
        label: data.label?.trim()
            && data.label.trim() !== 'Keyboard In'
            && data.label.trim() !== 'Midi In'
            ? data.label.trim()
            : 'Piano / keys in',
    };
}

export function getSingletonNodeTypes(): ReadonlySet<AudioNodeData['type']> {
    return SINGLETON_NODE_TYPES;
}

/** Port type from built-in YAML catalog when the editor node type is catalog-backed (respects `studioPortOverrides`). */
export function getCatalogPortValueType(
    nodeType: EditorNodeType,
    handleId: string,
    direction: HandleDirection,
    nodeData?: AudioNodeData,
): StudioNodePortValueType | null {
    const def = getStudioNodeDefinition(nodeType);
    if (!def) {
        return null;
    }
    const { inputs, outputs } = nodeData ? resolveStudioPortsForInstance(nodeData, def) : def;
    const ports = direction === 'source' ? outputs : inputs;
    const port = ports.find((p) => p.name === handleId);
    return port?.type ?? null;
}

/**
 * Whether two Studio port value types may connect (YAML catalog and/or handle `portValueType`).
 * Rules: same type; `int` ↔ `float` as numeric CV; `bool` and `enum` only to themselves.
 */
export function studioPortValueTypesConnectable(
    source: StudioNodePortValueType,
    target: StudioNodePortValueType,
): boolean {
    if (source === target) {
        return true;
    }
    if ((source === 'int' && target === 'float') || (source === 'float' && target === 'int')) {
        return true;
    }
    return false;
}

/**
 * Resolved port `type` for connection checks: Studio YAML/catalog first, then `portValueType` on handle descriptors
 * (e.g. matrix cells, patch slots) when the catalog row is not found by id.
 */
export function resolveStudioPortValueTypeAtHandle(
    node: Node<AudioNodeData>,
    handleId: string,
    direction: HandleDirection,
): StudioNodePortValueType | null {
    const fromCatalog = getCatalogPortValueType(node.data.type, handleId, direction, node.data);
    if (fromCatalog !== null) {
        return fromCatalog;
    }
    for (const h of getNodeHandleDescriptors(node.data)) {
        if (h.id === handleId && h.direction === direction && h.portValueType !== undefined) {
            return h.portValueType;
        }
    }
    return null;
}

/**
 * When both handles resolve to typed ports, enforce {@link studioPortValueTypesConnectable}.
 * Returns `false` if either side has no resolved port type.
 */
export function tryCatalogPortConnection(
    connection: GraphConnectionLike,
    nodeById: Map<string, Node<AudioNodeData>>,
    existingEdges?: Edge[],
): boolean {
    if (!connection.targetHandle || !connection.source || !connection.target) {
        return false;
    }
    const sourceNode = nodeById.get(connection.source);
    const targetNode = nodeById.get(connection.target);
    if (!sourceNode || !targetNode) {
        return false;
    }
    const sourceHandle = connection.sourceHandle ?? '';
    const targetHandle = connection.targetHandle;
    const srcType = resolveStudioPortValueTypeAtHandle(sourceNode, sourceHandle, 'source');
    const tgtType = resolveStudioPortValueTypeAtHandle(targetNode, targetHandle, 'target');
    if (srcType === null || tgtType === null) {
        return false;
    }
    if (!studioPortValueTypesConnectable(srcType, tgtType)) {
        return false;
    }
    if (tgtType === 'audio' && existingEdges) {
        if (!audioTargetAllowsFanIn(targetNode, targetHandle)) {
            const occupied = existingEdges.some((e) => e.target === connection.target && e.targetHandle === targetHandle);
            if (occupied) {
                return false;
            }
        }
    }
    return true;
}

const FLOW_EDGE_STROKE = {
    audio: '#23C768',
    trigger: '#FF5F58',
    control: '#4F75FF',
} as const;

/** Edge stroke aligned with socket semantic colors (`--semantic-success`, `--semantic-danger`, `--semantic-accent`). */
export function getConnectionEdgeStyle(
    connection: GraphConnectionLike,
    nodeById: Map<string, Node<AudioNodeData>>,
): { stroke: string; strokeWidth: number; strokeDasharray?: string } {
    const sourceNode = connection.source ? nodeById.get(connection.source) : null;
    const sourceHandle = connection.sourceHandle ?? '';
    if (sourceNode) {
        const srcType = resolveStudioPortValueTypeAtHandle(sourceNode, sourceHandle, 'source');
        if (srcType === 'audio') {
            return { stroke: FLOW_EDGE_STROKE.audio, strokeWidth: 3 };
        }
        if (srcType === 'trigger') {
            return { stroke: FLOW_EDGE_STROKE.trigger, strokeWidth: 2 };
        }
        if (srcType === 'int' || srcType === 'float' || srcType === 'bool' || srcType === 'enum') {
            return { stroke: FLOW_EDGE_STROKE.control, strokeWidth: 2, strokeDasharray: '5,5' };
        }
    }
    return { stroke: FLOW_EDGE_STROKE.control, strokeWidth: 2, strokeDasharray: '5,5' };
}

/** True when both ends of the edge resolve to catalog `audio` ports (for animation / Web Audio routing hints). */
export function isAudioConnection(
    connection: GraphConnectionLike,
    nodeById: Map<string, Node<AudioNodeData>>
): boolean {
    if (!connection.source || !connection.target || !connection.targetHandle) return false;
    const sourceNode = nodeById.get(connection.source);
    const targetNode = nodeById.get(connection.target);
    if (!sourceNode || !targetNode) return false;
    const sourceHandle = connection.sourceHandle ?? '';
    const src = resolveStudioPortValueTypeAtHandle(sourceNode, sourceHandle, 'source');
    const tgt = resolveStudioPortValueTypeAtHandle(targetNode, connection.targetHandle, 'target');
    return src === 'audio' && tgt === 'audio';
}

/**
 * Whether an audio input port may accept more than one upstream edge (fan-in).
 * Per `v2/specs/07-graph-editor.md`, default FX `in` ports are single-writer.
 */
export function audioTargetAllowsFanIn(targetNode: Node<AudioNodeData>, targetHandle: string): boolean {
    const t = targetNode.data.type;
    if (t === 'mixer' || t === 'matrixMixer') {
        return true;
    }
    if (t === 'switch') {
        return true;
    }
    if (t === 'patch' && (targetHandle === 'in' || targetHandle.startsWith('in'))) {
        return true;
    }
    return false;
}

/**
 * Whether an edge is allowed: both handles must resolve to a catalog port value type
 * (YAML and/or handle descriptors) and satisfy {@link studioPortValueTypesConnectable}.
 */
export function canConnect(
    connection: GraphConnectionLike,
    nodeById: Map<string, Node<AudioNodeData>>,
    existingEdges?: Edge[]
): boolean {
    if (!connection.source || !connection.target || !connection.targetHandle) return false;
    const sourceNode = nodeById.get(connection.source);
    const targetNode = nodeById.get(connection.target);
    if (!sourceNode || !targetNode) return false;
    if (connection.source === connection.target) return false;

    return tryCatalogPortConnection(connection, nodeById, existingEdges);
}

export function normalizeConnectionFromStart(
    start: ConnectionAssistStart,
    candidate: { nodeId: string; handleId: string | null; handleType: HandleDirection }
): NormalizedConnectionDescriptor | null {
    if (start.handleType === candidate.handleType) return null;

    if (start.handleType === 'source') {
        return {
            source: start.nodeId,
            sourceHandle: start.handleId,
            target: candidate.nodeId,
            targetHandle: candidate.handleId,
        };
    }

    return {
        source: candidate.nodeId,
        sourceHandle: candidate.handleId,
        target: start.nodeId,
        targetHandle: start.handleId,
    };
}

function createNodeLookup(nodes: Node<AudioNodeData>[]) {
    return new Map(nodes.map((node) => [node.id, node]));
}

function getNodeDisplayLabel(node: Node<AudioNodeData>): string {
    return String(node.data.label || getNodeCatalogEntry(node.data.type).label);
}

function mapHandleMatch(
    node: Node<AudioNodeData>,
    handle: HandleDescriptor,
    connection: NormalizedConnectionDescriptor
): CompatibleHandleMatch {
    return {
        key: `${node.id}:${handle.id}`,
        nodeId: node.id,
        nodeType: node.data.type,
        nodeLabel: getNodeDisplayLabel(node),
        handleId: handle.id,
        handleLabel: handle.label,
        handleType: handle.direction,
        connection,
    };
}

export function getCompatibleExistingHandleMatches(
    start: ConnectionAssistStart,
    nodes: Node<AudioNodeData>[],
    graphEdges?: Edge[]
): CompatibleHandleMatch[] {
    const nodeById = createNodeLookup(nodes);
    const expectedDirection: HandleDirection = start.handleType === 'source' ? 'target' : 'source';

    return nodes.flatMap((node) => {
        return getNodeHandleDescriptors(node.data)
            .filter((handle) => handle.direction === expectedDirection)
            .flatMap((handle) => {
                const connection = normalizeConnectionFromStart(start, {
                    nodeId: node.id,
                    handleId: handle.id,
                    handleType: handle.direction,
                });

                if (!connection || !canConnect(connection, nodeById, graphEdges)) {
                    return [];
                }

                return [mapHandleMatch(node, handle, connection)];
            });
    });
}

export function getCompatibleNodeSuggestions(
    start: ConnectionAssistStart,
    nodes: Node<AudioNodeData>[]
): NodeSuggestion[] {
    const existingTypes = new Set(nodes.map((node) => node.data.type));
    const baseLookup = createNodeLookup(nodes);
    const expectedDirection: HandleDirection = start.handleType === 'source' ? 'target' : 'source';

    return getEditorNodeCatalog().flatMap((entry) => {
        if (entry.singleton && existingTypes.has(entry.type)) {
            return [];
        }

        const virtualNode = createEditorNode(`__suggestion__${entry.type}`, entry.type, { x: 0, y: 0 });
        if (!virtualNode) return [];

        const lookup = new Map(baseLookup);
        lookup.set(virtualNode.id, virtualNode);

        return getNodeHandleDescriptors(virtualNode.data)
            .filter((handle) => handle.direction === expectedDirection)
            .flatMap((handle) => {
                const connection = normalizeConnectionFromStart(start, {
                    nodeId: virtualNode.id,
                    handleId: handle.id,
                    handleType: handle.direction,
                });

                if (!connection || !canConnect(connection, lookup)) {
                    return [];
                }

                return [{
                    ...mapHandleMatch(virtualNode, handle, connection),
                    type: entry.type,
                    icon: entry.icon,
                    color: entry.color,
                    title: `${entry.label} -> ${handle.label}`,
                }];
            });
    }).sort((left, right) => left.title.localeCompare(right.title));
}

export function migrateGraphNodes(nodes: Node<AudioNodeData>[]): Node<AudioNodeData>[] {
    const singletonSeen = new Set<AudioNodeData['type']>();

    return nodes.flatMap((node) => {
        if (getSingletonNodeTypes().has(node.data.type)) {
            if (singletonSeen.has(node.data.type)) {
                return [];
            }
            singletonSeen.add(node.data.type);
        }

        if (node.data.type === 'input') {
            const normalizedInput = normalizeInputNodeData(node.id, node.data as InputNodeData);
            if (
                isLegacyUiTokensInputLabel(normalizedInput.label)
                && hasAnyUiTokenInputParam(normalizedInput.params)
            ) {
                return [{
                    ...node,
                    type: 'uiTokensNode',
                    data: normalizeUiTokensNodeData({
                        type: 'uiTokens',
                        params: normalizedInput.params,
                        label: normalizedInput.label,
                    }) as UiTokensNodeData,
                }];
            }

            return [{
                ...node,
                data: normalizedInput,
            }];
        }

        if (node.data.type === 'uiTokens') {
            return [{
                ...node,
                type: 'uiTokensNode',
                data: normalizeUiTokensNodeData(node.data as UiTokensNodeData),
            }];
        }

        if (node.data.type === 'transport') {
            return [{
                ...node,
                data: normalizeTransportNodeData(node.data as TransportNodeData),
            }];
        }

        if (node.data.type === 'midiNote') {
            return [{
                ...node,
                data: normalizeMidiNoteNodeData(node.data as MidiNoteNodeData),
            }];
        }

        return [node];
    });
}

export function migrateGraphEdges(
    nodes: Node<AudioNodeData>[],
    edges: Edge[]
): Edge[] {
    const nodeById = createNodeLookup(nodes);

    return edges.flatMap((edge) => {
        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);

        let nextEdge = edge;
        const sourceType = sourceNode?.data.type;
        const targetType = targetNode?.data.type;

        if (sourceType && targetType) {
            if (
                sourceType === 'transport'
                && TRANSPORT_TARGET_TYPES.has(targetType)
                && !nextEdge.sourceHandle
                && (!nextEdge.targetHandle || nextEdge.targetHandle === 'transport')
            ) {
                nextEdge = {
                    ...nextEdge,
                    sourceHandle: 'out',
                    targetHandle: nextEdge.targetHandle ?? 'transport',
                };
            }

            if (
                TRIGGER_SOURCE_TYPES.has(sourceType)
                && !nextEdge.sourceHandle
                && (
                    !nextEdge.targetHandle
                    || nextEdge.targetHandle === 'trigger'
                    || nextEdge.targetHandle === 'gate'
                )
                && (
                    targetType === 'voice'
                    || targetType === 'sampler'
                    || targetType === 'adsr'
                    || targetType === 'noiseBurst'
                    || targetType === 'midiNoteOutput'
                )
            ) {
                nextEdge = {
                    ...nextEdge,
                    sourceHandle: 'trigger',
                    targetHandle: nextEdge.targetHandle ?? (targetType === 'adsr' ? 'gate' : 'trigger'),
                };
            }

            if (
                sourceType === 'voice'
                && nextEdge.sourceHandle === 'gate'
                && !nextEdge.targetHandle
                && (targetType === 'adsr' || targetType === 'sampler' || targetType === 'voice' || targetType === 'noiseBurst')
            ) {
                nextEdge = {
                    ...nextEdge,
                    targetHandle: targetType === 'adsr' ? 'gate' : 'trigger',
                };
            }

            if (
                isAudioNodeType(sourceType)
                && isAudioNodeType(targetType)
                && !nextEdge.sourceHandle
                && (!nextEdge.targetHandle || nextEdge.targetHandle === 'in')
                && targetType !== 'mixer'
            ) {
                nextEdge = {
                    ...nextEdge,
                    sourceHandle: 'out',
                    targetHandle: nextEdge.targetHandle ?? 'in',
                };
            }

            if (
                isAudioNodeType(sourceType)
                && isAudioNodeType(targetType)
                && nextEdge.sourceHandle === 'out'
                && !nextEdge.targetHandle
                && targetType !== 'mixer'
            ) {
                nextEdge = {
                    ...nextEdge,
                    targetHandle: 'in',
                };
            }
        }

        if (sourceNode && isInputLikeNodeType(sourceNode.data.type)) {
            const inputData = sourceNode.data as InputNodeData | UiTokensNodeData;
            const migratedHandle = migrateLegacyInputHandle(inputData.params, edge.sourceHandle);
            if (migratedHandle !== edge.sourceHandle) {
                nextEdge = { ...nextEdge, sourceHandle: migratedHandle ?? undefined };
            }
        }

        if (targetNode?.data.type === 'note' && nextEdge.targetHandle === 'trigger') {
            return [];
        }

        if (!canConnect(nextEdge, nodeById, edges.filter((e) => e.id !== edge.id))) {
            return [];
        }

        return [nextEdge];
    });
}

export function getTransportConnections(
    edges: Edge[],
    nodeById: Map<string, Node<AudioNodeData>>
): Set<string> {
    const connected = new Set<string>();

    edges.forEach((edge) => {
        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);
        if (
            sourceNode?.data.type === 'transport'
            && targetNode
            && TRANSPORT_TARGET_TYPES.has(targetNode.data.type)
            && edge.sourceHandle === 'out'
            && edge.targetHandle === 'transport'
        ) {
            connected.add(edge.target);
        }
    });

    return connected;
}
