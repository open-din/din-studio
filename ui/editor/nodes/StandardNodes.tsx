import { memo, useMemo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { audioEngine } from '../AudioEngine';
import {
    NodeCheckboxField,
    NodeHandleRow,
    NodeNumberField,
    NodeSelectField,
    NodeShell,
    NodeTextField,
    NodeValueBadge,
    NodeWidget,
    type NodeHandleKind,
} from '../components/NodeShell';
import { getNodeCatalogEntry, getNodeHandleDescriptors } from '../nodeCatalog';
import { formatConnectedValue, useTargetHandleConnection } from '../paramConnections';
import { useAudioGraphStore } from '../store';
import type {
    ADSRNodeData,
    AnalyzerNodeData,
    AudioNodeData,
    AuxReturnNodeData,
    AuxSendNodeData,
    ChorusNodeData,
    ClampNodeData,
    CompareNodeData,
    CompressorNodeData,
    ConstantSourceNodeData,
    ConvolverNodeData,
    DelayNodeData,
    DistortionNodeData,
    EQ3NodeData,
    EventTriggerNodeData,
    FilterNodeData,
    FlangerNodeData,
    GainNodeData,
    LFONodeData,
    MathNodeData,
    MediaStreamNodeData,
    MixerNodeData,
    MixNodeData,
    NoiseBurstNodeData,
    NoiseNodeData,
    NoteNodeData,
    OscNodeData,
    PhaserNodeData,
    Panner3DNodeData,
    ReverbNodeData,
    StereoPannerNodeData,
    SwitchNodeData,
    TransportNodeData,
    TremoloNodeData,
    VoiceNodeData,
    WaveShaperNodeData,
} from '../types';

type FieldKind = 'number' | 'checkbox' | 'select' | 'text';
type PrimitiveValue = string | number | boolean | null | undefined;

interface FieldOption {
    label: string;
    value: string;
}

interface FieldDef<T extends AudioNodeData = AudioNodeData> {
    key: string;
    label: string;
    kind?: FieldKind;
    handleId?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: FieldOption[];
    formatValue?: (value: number, data: T) => string;
    getValue?: (data: T) => PrimitiveValue;
    apply?: (value: PrimitiveValue, data: T) => Partial<T>;
}

interface StandardNodeDefinition<T extends AudioNodeData = AudioNodeData> {
    widgetTitle?: string;
    bodyFields?: FieldDef<T>[] | ((data: T) => FieldDef<T>[]);
    targetFields?: ((data: T) => FieldDef<T>[]);
    autoBody?: boolean;
    excludeAutoBodyKeys?: string[];
    badge?: (data: T) => string | null;
}

const WAVEFORM_OPTIONS: FieldOption[] = [
    { label: 'Sine', value: 'sine' },
    { label: 'Square', value: 'square' },
    { label: 'Sawtooth', value: 'sawtooth' },
    { label: 'Triangle', value: 'triangle' },
];

const NOISE_OPTIONS: FieldOption[] = [
    { label: 'White', value: 'white' },
    { label: 'Pink', value: 'pink' },
    { label: 'Brown', value: 'brown' },
];

const FILTER_OPTIONS: FieldOption[] = [
    'lowpass',
    'highpass',
    'bandpass',
    'lowshelf',
    'highshelf',
    'peaking',
    'notch',
    'allpass',
].map((value) => ({ label: value, value }));

const DISTORTION_OPTIONS: FieldOption[] = [
    { label: 'Soft', value: 'soft' },
    { label: 'Hard', value: 'hard' },
    { label: 'Fuzz', value: 'fuzz' },
    { label: 'Bitcrush', value: 'bitcrush' },
    { label: 'Saturate', value: 'saturate' },
];

const WAVESHAPER_PRESET_OPTIONS: FieldOption[] = [
    { label: 'Soft Clip', value: 'softClip' },
    { label: 'Hard Clip', value: 'hardClip' },
    { label: 'Saturate', value: 'saturate' },
];

const OVERSAMPLE_OPTIONS: FieldOption[] = [
    { label: 'None', value: 'none' },
    { label: '2x', value: '2x' },
    { label: '4x', value: '4x' },
];

const PANNING_MODEL_OPTIONS: FieldOption[] = [
    { label: 'Equal Power', value: 'equalpower' },
    { label: 'HRTF', value: 'HRTF' },
];

const DISTANCE_MODEL_OPTIONS: FieldOption[] = [
    { label: 'Linear', value: 'linear' },
    { label: 'Inverse', value: 'inverse' },
    { label: 'Exponential', value: 'exponential' },
];

const AUX_TAP_OPTIONS: FieldOption[] = [
    { label: 'Pre', value: 'pre' },
    { label: 'Post', value: 'post' },
];

const EVENT_TRIGGER_MODE_OPTIONS: FieldOption[] = [
    { label: 'Change', value: 'change' },
    { label: 'Rising', value: 'rising' },
];

const NOTE_LANGUAGE_OPTIONS: FieldOption[] = [
    { label: 'English', value: 'en' },
    { label: 'French', value: 'fr' },
];

const COMPARE_OPTIONS: FieldOption[] = [
    { label: 'Greater Than', value: 'gt' },
    { label: 'Greater or Equal', value: 'gte' },
    { label: 'Less Than', value: 'lt' },
    { label: 'Less or Equal', value: 'lte' },
    { label: 'Equal', value: 'eq' },
    { label: 'Not Equal', value: 'neq' },
];

const MATH_OPTIONS: FieldOption[] = [
    'add',
    'subtract',
    'multiply',
    'divide',
    'multiplyAdd',
    'power',
    'logarithm',
    'sqrt',
    'invSqrt',
    'abs',
    'exp',
    'min',
    'max',
    'lessThan',
    'greaterThan',
    'sign',
    'compare',
    'smoothMin',
    'smoothMax',
    'round',
    'floor',
    'ceil',
    'truncate',
    'fraction',
    'truncModulo',
    'floorModulo',
    'wrap',
    'snap',
    'pingPong',
    'sin',
    'cos',
    'tan',
    'asin',
    'acos',
    'atan',
    'atan2',
    'sinh',
    'cosh',
    'tanh',
].map((value) => ({
    label: value.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
    value,
}));

const CLAMP_MODE_OPTIONS: FieldOption[] = [
    { label: 'Min / Max', value: 'minmax' },
    { label: 'Range', value: 'range' },
];

const OPTIONS_BY_KEY: Partial<Record<string, FieldOption[]>> = {
    waveform: WAVEFORM_OPTIONS,
    noiseType: NOISE_OPTIONS,
    filterType: FILTER_OPTIONS,
    distortionType: DISTORTION_OPTIONS,
    preset: WAVESHAPER_PRESET_OPTIONS,
    oversample: OVERSAMPLE_OPTIONS,
    panningModel: PANNING_MODEL_OPTIONS,
    distanceModel: DISTANCE_MODEL_OPTIONS,
    tap: AUX_TAP_OPTIONS,
    mode: EVENT_TRIGGER_MODE_OPTIONS,
    language: NOTE_LANGUAGE_OPTIONS,
    operation: COMPARE_OPTIONS,
};

const MATH_KEY_OPTIONS = { operation: MATH_OPTIONS };
const CLAMP_KEY_OPTIONS = { mode: CLAMP_MODE_OPTIONS };

const TYPE_DEFAULTS: Partial<Record<AudioNodeData['type'], StandardNodeDefinition<any>>> = {
    osc: { widgetTitle: 'Waveform' },
    gain: {
        widgetTitle: 'Controls',
        targetFields: () => [
            {
                key: 'gain',
                label: 'Gain',
                handleId: 'gain',
                formatValue: (value: number) => value.toFixed(2),
            },
        ],
    },
    filter: { widgetTitle: 'Filter' },
    noise: { widgetTitle: 'Source' },
    transport: {
        widgetTitle: 'Clock',
        excludeAutoBodyKeys: ['playing'],
    },
    lfo: { widgetTitle: 'Waveform' },
    eventTrigger: { widgetTitle: 'Trigger' },
    note: {
        widgetTitle: 'Pitch',
        bodyFields: [
            { key: 'note', label: 'Note', kind: 'text' },
            { key: 'octave', label: 'Octave', min: 0, max: 8, step: 1 },
            { key: 'frequency', label: 'Frequency', min: 0, step: 0.1, formatValue: (value) => formatFrequency(value) },
            { key: 'language', label: 'Language', kind: 'select', options: NOTE_LANGUAGE_OPTIONS },
        ],
        autoBody: false,
    },
    math: {
        widgetTitle: 'Operation',
        bodyFields: [{ key: 'operation', label: 'Operation', kind: 'select', options: MATH_OPTIONS }],
        autoBody: false,
    },
    compare: {
        widgetTitle: 'Comparison',
        bodyFields: [{ key: 'operation', label: 'Operation', kind: 'select', options: COMPARE_OPTIONS }],
        autoBody: false,
    },
    mix: {
        widgetTitle: 'Blend',
        bodyFields: [{ key: 'clamp', label: 'Clamp', kind: 'checkbox' }],
        autoBody: false,
    },
    clamp: {
        widgetTitle: 'Bounds',
        bodyFields: [{ key: 'mode', label: 'Mode', kind: 'select', options: CLAMP_MODE_OPTIONS }],
        autoBody: false,
    },
    switch: {
        widgetTitle: 'Routing',
        autoBody: false,
        bodyFields: [
            {
                key: 'inputs',
                label: 'Inputs',
                min: 2,
                max: 8,
                step: 1,
                apply: (value, data) => {
                    const nextInputs = Math.min(8, Math.max(2, Number(value)));
                    const values = Array.from({ length: nextInputs }, (_, index) => data.values[index] ?? 0);
                    return {
                        inputs: nextInputs,
                        values,
                        selectedIndex: Math.min(data.selectedIndex, nextInputs - 1),
                    } as Partial<SwitchNodeData>;
                },
            },
        ],
        targetFields: (data: SwitchNodeData) => [
            {
                key: 'selectedIndex',
                label: 'Index',
                handleId: 'index',
                min: 0,
                max: Math.max(0, data.inputs - 1),
                step: 1,
            },
            ...Array.from({ length: Math.max(1, data.inputs || data.values.length || 1) }, (_, index) => ({
                key: `value-${index}`,
                label: `In ${index + 1}`,
                handleId: `in_${index}`,
                getValue: () => data.values[index] ?? 0,
                apply: (value: PrimitiveValue) => ({
                    values: data.values.map((entry, valueIndex) => valueIndex === index ? Number(value) : entry),
                } as Partial<SwitchNodeData>),
            })),
        ],
    },
    mixer: {
        widgetTitle: 'Routing',
        autoBody: false,
        bodyFields: [{ key: 'inputs', label: 'Inputs', min: 2, max: 3, step: 1 }],
    },
};

const HANDLE_KEY_OVERRIDES: Partial<Record<AudioNodeData['type'], Record<string, string>>> = {
    switch: { index: 'selectedIndex' },
};

function prettifyKey(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, (value) => value.toUpperCase());
}

function formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
}

function formatFrequency(value: number): string {
    if (!Number.isFinite(value)) return '--';
    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(2)} kHz`;
    }
    return `${Math.round(value)} Hz`;
}

function formatDuration(value: number): string {
    if (!Number.isFinite(value)) return '--';
    if (Math.abs(value) < 1) {
        return `${Math.round(value * 1000)} ms`;
    }
    return `${value.toFixed(2)} s`;
}

function formatDetune(value: number): string {
    return `${Math.round(value)} c`;
}

function formatDecibels(value: number): string {
    return `${value.toFixed(1)} dB`;
}

function inferHandleKind(nodeType: AudioNodeData['type'], handleId: string, direction: 'source' | 'target'): NodeHandleKind {
    if (handleId === 'trigger' || handleId === 'gate' || handleId === 'transport') {
        return 'trigger';
    }

    if (nodeType === 'mixer' || nodeType === 'osc' || nodeType === 'noise' || nodeType === 'filter' || nodeType === 'delay'
        || nodeType === 'reverb' || nodeType === 'compressor' || nodeType === 'phaser' || nodeType === 'flanger'
        || nodeType === 'tremolo' || nodeType === 'eq3' || nodeType === 'distortion' || nodeType === 'chorus'
        || nodeType === 'waveShaper' || nodeType === 'convolver' || nodeType === 'analyzer' || nodeType === 'panner'
        || nodeType === 'panner3d' || nodeType === 'auxSend' || nodeType === 'auxReturn' || nodeType === 'output'
        || nodeType === 'mediaStream' || nodeType === 'sampler')
    {
        if (handleId === 'in' || handleId === 'out' || handleId === 'sidechainIn' || /^in\d+$/.test(handleId) || /^out\d+$/.test(handleId)) {
            return 'audio';
        }
    }

    if (direction === 'source' && nodeType === 'input') return 'control';
    if (direction === 'source' && nodeType === 'uiTokens') return 'control';
    if (direction === 'source' && nodeType === 'note') return 'control';
    if (direction === 'source' && nodeType === 'constantSource') return 'control';
    if (direction === 'source' && nodeType === 'lfo') return 'control';
    if (direction === 'source' && nodeType === 'adsr') return 'control';
    if (direction === 'source' && nodeType === 'voice') return handleId === 'gate' ? 'trigger' : 'control';
    if (direction === 'source' && nodeType === 'midiNote') return handleId === 'trigger' || handleId === 'gate' ? 'trigger' : 'control';
    if (direction === 'source' && nodeType === 'midiCC') return 'control';
    if (direction === 'source' && nodeType === 'transport') return 'trigger';
    if (direction === 'source' && nodeType === 'eventTrigger') return 'trigger';
    if (nodeType === 'math' || nodeType === 'compare' || nodeType === 'mix' || nodeType === 'clamp' || nodeType === 'switch') {
        return 'control';
    }

    return 'control';
}

function getFormatForField<T extends AudioNodeData>(field: FieldDef<T>): ((value: number, data: T) => string) | undefined {
    if (field.formatValue) return field.formatValue;

    switch (field.key) {
        case 'frequency':
        case 'lowFrequency':
        case 'highFrequency':
        case 'baseFrequency':
            return (value) => formatFrequency(value);
        case 'delayTime':
        case 'decay':
        case 'attack':
        case 'release':
        case 'duration':
        case 'portamento':
            return (value) => formatDuration(value);
        case 'detune':
            return (value) => formatDetune(value);
        case 'low':
        case 'mid':
        case 'high':
        case 'threshold':
        case 'gain':
            return (value) => formatDecibels(value);
        case 'mix':
        case 'depth':
        case 'velocity':
        case 'masterGain':
        case 'sendGain':
        case 'sustain':
            return (value) => formatPercent(value);
        default:
            return undefined;
    }
}

function inferFieldKind<T extends AudioNodeData>(field: FieldDef<T>, value: PrimitiveValue): FieldKind {
    if (field.kind) return field.kind;
    if (field.options?.length) return 'select';
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    return 'text';
}

function buildAutoField<T extends AudioNodeData>(key: string, value: PrimitiveValue): FieldDef<T> {
    const options = OPTIONS_BY_KEY[key] ?? undefined;
    return {
        key,
        label: prettifyKey(key),
        kind: options ? 'select' : undefined,
        options,
    };
}

function getFieldValue<T extends AudioNodeData>(field: FieldDef<T>, data: T): PrimitiveValue {
    if (field.getValue) return field.getValue(data);
    return (data as Record<string, PrimitiveValue>)[field.key];
}

function createPatch<T extends AudioNodeData>(field: FieldDef<T>, value: PrimitiveValue, data: T): Partial<T> {
    if (field.apply) {
        return field.apply(value, data);
    }

    return { [field.key]: value } as Partial<T>;
}

function defaultPatchNode<T extends AudioNodeData>(
    id: string,
    patch: Partial<T>,
    updateNodeData: (nodeId: string, data: Partial<AudioNodeData>) => void,
) {
    updateNodeData(id, patch as Partial<AudioNodeData>);
    audioEngine.updateNode(id, patch as Partial<AudioNodeData>);
}

function FieldControl<T extends AudioNodeData>({
    field,
    data,
    onChange,
    className,
}: {
    field: FieldDef<T>;
    data: T;
    onChange: (value: PrimitiveValue) => void;
    className?: string;
}) {
    const value = getFieldValue(field, data);
    const kind = inferFieldKind(field, value);

    if (kind === 'checkbox') {
        return (
            <NodeCheckboxField
                checked={Boolean(value)}
                onChange={onChange}
                className={className}
            />
        );
    }

    if (kind === 'select') {
        return (
            <NodeSelectField
                value={typeof value === 'string' ? value : String(field.options?.[0]?.value ?? '')}
                onChange={onChange}
                className={className}
            >
                {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </NodeSelectField>
        );
    }

    if (kind === 'text') {
        return (
            <NodeTextField
                value={typeof value === 'string' ? value : String(value ?? '')}
                onChange={onChange}
                className={className}
            />
        );
    }

    return (
        <NodeNumberField
            value={typeof value === 'number' ? value : 0}
            min={field.min}
            max={field.max}
            step={field.step ?? 0.01}
            onChange={onChange as (value: number) => void}
            className={className}
        />
    );
}

function TargetFieldRow<T extends AudioNodeData>({
    nodeId,
    data,
    field,
}: {
    nodeId: string;
    data: T;
    field: FieldDef<T>;
}) {
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const connection = useTargetHandleConnection(nodeId, field.handleId ?? field.key);
    const value = getFieldValue(field, data);
    const formatter = getFormatForField(field);

    const handleChange = (nextValue: PrimitiveValue) => {
        defaultPatchNode(nodeId, createPatch(field, nextValue, data), updateNodeData);
    };

    return (
        <NodeHandleRow
            direction="target"
            label={field.label}
            handleId={field.handleId}
            handleKind={inferHandleKind(data.type, field.handleId ?? field.key, 'target')}
            control={connection.connected ? (
                <NodeValueBadge live className="node-shell__row-field">
                    {formatConnectedValue(connection.value, formatter ? (liveValue) => formatter(liveValue, data) : undefined)}
                </NodeValueBadge>
            ) : (
                <FieldControl field={field} data={data} onChange={handleChange} className="node-shell__row-field" />
            )}
        />
    );
}

function resolveTargetFields<T extends AudioNodeData>(definition: StandardNodeDefinition<T>, data: T): FieldDef<T>[] {
    if (definition.targetFields) {
        return definition.targetFields(data);
    }

    const descriptors = getNodeHandleDescriptors(data).filter((descriptor) => descriptor.direction === 'target');
    const overrides = HANDLE_KEY_OVERRIDES[data.type] ?? {};

    return descriptors
        .map((descriptor) => {
            const key = overrides[descriptor.id] ?? descriptor.id;
            const rawValue = (data as Record<string, PrimitiveValue>)[key];
            if (typeof rawValue === 'undefined') {
                return null;
            }

            return {
                key,
                label: descriptor.label,
                handleId: descriptor.id,
            } as FieldDef<T>;
        })
        .filter((field): field is FieldDef<T> => field !== null);
}

function resolveBodyFields<T extends AudioNodeData>(definition: StandardNodeDefinition<T>, data: T, targetFields: FieldDef<T>[]): FieldDef<T>[] {
    const explicitFields = typeof definition.bodyFields === 'function'
        ? definition.bodyFields(data)
        : (definition.bodyFields ?? []);
    const explicitKeys = new Set(explicitFields.map((field) => field.key));
    const targetKeys = new Set(targetFields.map((field) => field.key));
    const excludeKeys = new Set(['type', 'label', ...(definition.excludeAutoBodyKeys ?? [])]);

    if (definition.autoBody === false) {
        return explicitFields;
    }

    const autoFields = Object.entries(data)
        .filter(([key, value]) => {
            if (excludeKeys.has(key) || explicitKeys.has(key) || targetKeys.has(key)) return false;
            if (Array.isArray(value) || (value && typeof value === 'object')) return false;
            return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
        })
        .map(([key, value]) => buildAutoField<T>(key, value as PrimitiveValue));

    return [...explicitFields, ...autoFields];
}

function StandardNode<T extends AudioNodeData>({
    id,
    data,
    selected,
    nodeType,
    definition,
}: NodeProps & {
    nodeType: T['type'];
    definition: StandardNodeDefinition<T>;
}) {
    const nodeData = data as T;
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const handles = useMemo(() => getNodeHandleDescriptors(nodeData), [nodeData]);
    const sourceHandles = handles.filter((descriptor) => descriptor.direction === 'source');
    const targetFields = resolveTargetFields(definition, nodeData);
    const targetHandleIds = new Set(targetFields.map((field) => field.handleId ?? field.key));
    const labelOnlyTargets = handles.filter((descriptor) => descriptor.direction === 'target' && !targetHandleIds.has(descriptor.id));
    const bodyFields = resolveBodyFields(definition, nodeData, targetFields);
    const widgetTitle = definition.widgetTitle ?? 'Controls';
    const badgeLabel = definition.badge?.(nodeData) ?? null;

    const handleBodyFieldChange = (field: FieldDef<T>, value: PrimitiveValue) => {
        defaultPatchNode(id, createPatch(field, value, nodeData), updateNodeData);
    };

    return (
        <NodeShell
            nodeType={nodeType}
            title={nodeData.label?.trim() || getNodeCatalogEntry(nodeType).label}
            selected={selected}
            badge={badgeLabel ? <NodeValueBadge>{badgeLabel}</NodeValueBadge> : undefined}
        >
            {sourceHandles.map((descriptor) => (
                <NodeHandleRow
                    key={`${id}-${descriptor.id}`}
                    direction="source"
                    label={descriptor.label}
                    handleId={descriptor.id}
                    handleKind={inferHandleKind(nodeData.type, descriptor.id, 'source')}
                />
            ))}

            {bodyFields.length > 0 ? (
                <NodeWidget title={widgetTitle}>
                    {bodyFields.map((field) => (
                        <div key={`${id}-body-${field.key}`} className="node-shell__widget-field">
                            <span className="node-shell__widget-field-label">{field.label}</span>
                            <FieldControl
                                field={field}
                                data={nodeData}
                                onChange={(value) => handleBodyFieldChange(field, value)}
                            />
                        </div>
                    ))}
                </NodeWidget>
            ) : null}

            {targetFields.map((field) => (
                <TargetFieldRow key={`${id}-${field.handleId ?? field.key}`} nodeId={id} data={nodeData} field={field} />
            ))}

            {labelOnlyTargets.map((descriptor) => (
                <NodeHandleRow
                    key={`${id}-label-${descriptor.id}`}
                    direction="target"
                    label={descriptor.label}
                    handleId={descriptor.id}
                    handleKind={inferHandleKind(nodeData.type, descriptor.id, 'target')}
                />
            ))}
        </NodeShell>
    );
}

function createStandardNodeComponent<T extends AudioNodeData>(
    nodeType: T['type'],
    definition: StandardNodeDefinition<T> = {},
) {
    const Component = memo((props: NodeProps) => (
        <StandardNode {...props} nodeType={nodeType} definition={definition} />
    ));

    Component.displayName = `${nodeType}StandardNode`;
    return Component;
}

export const OscNode = createStandardNodeComponent<OscNodeData>('osc', TYPE_DEFAULTS.osc);
export const GainNode = createStandardNodeComponent<GainNodeData>('gain', TYPE_DEFAULTS.gain);
export const FilterNode = createStandardNodeComponent<FilterNodeData>('filter', TYPE_DEFAULTS.filter);
export const NoiseNode = createStandardNodeComponent<NoiseNodeData>('noise', TYPE_DEFAULTS.noise);
export const DelayNode = createStandardNodeComponent<DelayNodeData>('delay');
export const ReverbNode = createStandardNodeComponent<ReverbNodeData>('reverb');
export const CompressorNode = createStandardNodeComponent<CompressorNodeData>('compressor');
export const PhaserNode = createStandardNodeComponent<PhaserNodeData>('phaser');
export const FlangerNode = createStandardNodeComponent<FlangerNodeData>('flanger');
export const TremoloNode = createStandardNodeComponent<TremoloNodeData>('tremolo');
export const EQ3Node = createStandardNodeComponent<EQ3NodeData>('eq3');
export const DistortionNode = createStandardNodeComponent<DistortionNodeData>('distortion');
export const ChorusNode = createStandardNodeComponent<ChorusNodeData>('chorus');
export const NoiseBurstNode = createStandardNodeComponent<NoiseBurstNodeData>('noiseBurst');
export const WaveShaperNode = createStandardNodeComponent<WaveShaperNodeData>('waveShaper');
export const ConvolverNode = createStandardNodeComponent<ConvolverNodeData>('convolver', {
    excludeAutoBodyKeys: ['assetPath', 'impulseId', 'impulseFileName'],
});
export const AnalyzerNode = createStandardNodeComponent<AnalyzerNodeData>('analyzer');
export const StereoPannerNode = createStandardNodeComponent<StereoPannerNodeData>('panner');
export const Panner3DNode = createStandardNodeComponent<Panner3DNodeData>('panner3d');
export const ConstantSourceNode = createStandardNodeComponent<ConstantSourceNodeData>('constantSource');
export const MediaStreamNode = createStandardNodeComponent<MediaStreamNodeData>('mediaStream');
export const EventTriggerNode = createStandardNodeComponent<EventTriggerNodeData>('eventTrigger', TYPE_DEFAULTS.eventTrigger);
export const NoteNode = createStandardNodeComponent<NoteNodeData>('note', TYPE_DEFAULTS.note);
export const TransportNode = createStandardNodeComponent<TransportNodeData>('transport', TYPE_DEFAULTS.transport);
export const LFONode = createStandardNodeComponent<LFONodeData>('lfo', TYPE_DEFAULTS.lfo);
export const ADSRNode = createStandardNodeComponent<ADSRNodeData>('adsr');
export const VoiceNode = createStandardNodeComponent<VoiceNodeData>('voice');
export const MixerNode = createStandardNodeComponent<MixerNodeData>('mixer', TYPE_DEFAULTS.mixer);
export const AuxSendNode = createStandardNodeComponent<AuxSendNodeData>('auxSend');
export const AuxReturnNode = createStandardNodeComponent<AuxReturnNodeData>('auxReturn');
export const MathNode = createStandardNodeComponent<MathNodeData>('math', {
    ...TYPE_DEFAULTS.math,
    bodyFields: [{ key: 'operation', label: 'Operation', kind: 'select', options: MATH_KEY_OPTIONS.operation }],
});
export const CompareNode = createStandardNodeComponent<CompareNodeData>('compare', TYPE_DEFAULTS.compare);
export const MixNode = createStandardNodeComponent<MixNodeData>('mix', TYPE_DEFAULTS.mix);
export const ClampNode = createStandardNodeComponent<ClampNodeData>('clamp', TYPE_DEFAULTS.clamp);
export const SwitchNode = createStandardNodeComponent<SwitchNodeData>('switch', TYPE_DEFAULTS.switch);
