/**
 * Compatibility: returns the same definitions as {@link loadStudioNodeCatalog}.
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import { loadStudioNodeCatalog } from './catalog';
import type { EditorNodeType } from './types';
import type { StudioNodeDefinition, StudioNodeType } from './definition';

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

/**
 * Same as {@link loadStudioNodeCatalog} — YAML + JSON overrides are the source of truth.
 */
export function legacyBootstrapStudioDefinitions(): StudioNodeDefinition[] {
    return loadStudioNodeCatalog();
}
