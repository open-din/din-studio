/**
 * Build `StudioNodeDefinition[]` from the legacy `EDITOR_NODE_CATALOG` + `DEFAULT_HANDLES_BY_TYPE`.
 * Used for tooling and compatibility; **not** merged into `loadStudioNodeCatalog()` (palette is YAML + JSON only).
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import { DEFAULT_HANDLES_BY_TYPE, EDITOR_NODE_CATALOG } from '../nodeCatalog/data';
import type { EditorNodeType, HandleDescriptor } from '../nodeCatalog/types';
import type { StudioNodeDefinition, StudioNodePortSchema, StudioNodeType } from './types';

const DSP_PLACEHOLDER = 'process = _,_;';

/** Maps every editor node type to the Studio UI taxonomy (§10.3). */
export const STUDIO_UI_TYPE_BY_EDITOR: Record<EditorNodeType, StudioNodeType> = {
    input: 'interface',
    uiTokens: 'value',
    eventTrigger: 'value',
    transport: 'transport',
    stepSequencer: 'timeline',
    pianoRoll: 'timeline',
    lfo: 'dsp',
    constantSource: 'value',
    mediaStream: 'interface',
    patch: 'interface',
    voice: 'voice',
    adsr: 'dsp',
    note: 'value',
    osc: 'dsp',
    noise: 'dsp',
    noiseBurst: 'dsp',
    sampler: 'asset',
    midiNote: 'interface',
    midiCC: 'interface',
    midiNoteOutput: 'interface',
    midiCCOutput: 'interface',
    midiSync: 'interface',
    midiPlayer: 'timeline',
    gain: 'dsp',
    filter: 'dsp',
    compressor: 'dsp',
    delay: 'dsp',
    reverb: 'dsp',
    phaser: 'dsp',
    flanger: 'dsp',
    tremolo: 'dsp',
    eq3: 'dsp',
    distortion: 'dsp',
    chorus: 'dsp',
    waveShaper: 'dsp',
    convolver: 'dsp',
    analyzer: 'dsp',
    panner: 'dsp',
    panner3d: 'dsp',
    mixer: 'dsp',
    auxSend: 'dsp',
    auxReturn: 'dsp',
    matrixMixer: 'dsp',
    output: 'interface',
    math: 'value',
    compare: 'value',
    mix: 'value',
    clamp: 'value',
    switch: 'value',
};

function inferPortValueType(id: string, direction: HandleDescriptor['direction']): StudioNodePortSchema['type'] {
    const lid = id.toLowerCase();
    if (lid === 'trigger' || lid === 'gate' || lid === 'transport') {
        return 'trigger';
    }
    if (lid === 'out' || /^out\d*$/.test(lid)) {
        return direction === 'source' ? 'audio' : 'float';
    }
    if (
        lid === 'in'
        || lid === 'sidechainin'
        || lid.startsWith('in')
        || lid.startsWith('in_')
        || /^in\d+$/.test(lid)
    ) {
        return direction === 'target' ? 'audio' : 'float';
    }
    return 'float';
}

function inferPortInterface(valueType: StudioNodePortSchema['type']): StudioNodePortSchema['interface'] {
    if (valueType === 'audio' || valueType === 'trigger') {
        return 'input';
    }
    return 'slider';
}

function handleToPort(h: HandleDescriptor): StudioNodePortSchema {
    const vt = inferPortValueType(h.id, h.direction);
    return {
        type: vt,
        name: h.id,
        interface: inferPortInterface(vt),
    };
}

/**
 * One definition per legacy catalog row, suitable until JSON fully replaces bootstrap.
 */
export function legacyBootstrapStudioDefinitions(): StudioNodeDefinition[] {
    return EDITOR_NODE_CATALOG.map((entry) => {
        const handles = DEFAULT_HANDLES_BY_TYPE[entry.type];
        const inputs = handles.filter((h) => h.direction === 'target').map(handleToPort);
        const outputs = handles.filter((h) => h.direction === 'source').map(handleToPort);
        const uiType = STUDIO_UI_TYPE_BY_EDITOR[entry.type];
        const legacyLabel = entry.label.trim();
        const def: StudioNodeDefinition = {
            name: entry.type,
            label: legacyLabel.length > 0 ? legacyLabel : null,
            description: `${entry.label} — Studio legacy catalog row.`,
            type: uiType,
            inputs,
            outputs,
            customComponent: null,
            tags: [entry.type, entry.category.toLowerCase()],
            category: entry.category,
            subcategory: 'General',
        };
        if (uiType === 'dsp') {
            return { ...def, dsp: DSP_PLACEHOLDER };
        }
        return def;
    });
}
