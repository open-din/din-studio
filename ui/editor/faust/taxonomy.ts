import type { EditorNodeType } from '../nodeCatalog/types';

/**
 * Structural role for v2 catalog alignment (`v2/specs/03-node-model.md`).
 */
export type StructuralNodeType = 'dsp' | 'control' | 'routing' | 'interface' | 'metadata';

export interface NodeTaxonomy {
    /** High-level structural classification. */
    structuralType: StructuralNodeType;
    /** Stable domain vocabulary key (e.g. `audio.dsp.osc`). */
    domainKind: string;
    /** When set, maps to {@link DSP_PRIMITIVE_REGISTRY} for Faust lowering. */
    dspPrimitiveKind?: string;
}

/**
 * Taxonomy for every editor node type. Used by extraction, palette metadata, and tests.
 */
export const NODE_TAXONOMY: Record<EditorNodeType, NodeTaxonomy> = {
    input: { structuralType: 'interface', domainKind: 'audio.interface.input' },
    uiTokens: { structuralType: 'metadata', domainKind: 'ui.tokens' },
    eventTrigger: { structuralType: 'control', domainKind: 'event.trigger' },
    transport: { structuralType: 'metadata', domainKind: 'transport.clock' },
    stepSequencer: { structuralType: 'metadata', domainKind: 'timeline.stepSequencer' },
    pianoRoll: { structuralType: 'metadata', domainKind: 'timeline.pianoRoll' },
    lfo: { structuralType: 'control', domainKind: 'modulation.lfo' },
    constantSource: { structuralType: 'dsp', domainKind: 'audio.dsp.constant', dspPrimitiveKind: 'constant' },
    mediaStream: { structuralType: 'interface', domainKind: 'audio.interface.media' },
    patch: { structuralType: 'metadata', domainKind: 'graph.patch' },
    voice: { structuralType: 'dsp', domainKind: 'audio.dsp.voice' },
    adsr: { structuralType: 'dsp', domainKind: 'audio.dsp.adsr', dspPrimitiveKind: 'adsr' },
    note: { structuralType: 'control', domainKind: 'note.pitch' },
    osc: { structuralType: 'dsp', domainKind: 'audio.dsp.osc', dspPrimitiveKind: 'osc' },
    noise: { structuralType: 'dsp', domainKind: 'audio.dsp.noise', dspPrimitiveKind: 'noise' },
    noiseBurst: { structuralType: 'dsp', domainKind: 'audio.dsp.noiseBurst' },
    sampler: { structuralType: 'dsp', domainKind: 'audio.dsp.sampler' },
    midiNote: { structuralType: 'interface', domainKind: 'midi.input.note' },
    midiCC: { structuralType: 'interface', domainKind: 'midi.input.cc' },
    midiNoteOutput: { structuralType: 'interface', domainKind: 'midi.output.note' },
    midiCCOutput: { structuralType: 'interface', domainKind: 'midi.output.cc' },
    midiSync: { structuralType: 'interface', domainKind: 'midi.sync' },
    midiPlayer: { structuralType: 'metadata', domainKind: 'midi.player' },
    gain: { structuralType: 'dsp', domainKind: 'audio.dsp.gain', dspPrimitiveKind: 'gain' },
    filter: { structuralType: 'dsp', domainKind: 'audio.dsp.filter', dspPrimitiveKind: 'filter' },
    compressor: { structuralType: 'dsp', domainKind: 'audio.dsp.compressor', dspPrimitiveKind: 'compressor' },
    delay: { structuralType: 'dsp', domainKind: 'audio.dsp.delay', dspPrimitiveKind: 'delay' },
    reverb: { structuralType: 'dsp', domainKind: 'audio.dsp.reverb', dspPrimitiveKind: 'reverb' },
    phaser: { structuralType: 'dsp', domainKind: 'audio.dsp.phaser', dspPrimitiveKind: 'phaser' },
    flanger: { structuralType: 'dsp', domainKind: 'audio.dsp.flanger', dspPrimitiveKind: 'flanger' },
    tremolo: { structuralType: 'dsp', domainKind: 'audio.dsp.tremolo', dspPrimitiveKind: 'tremolo' },
    eq3: { structuralType: 'dsp', domainKind: 'audio.dsp.eq3', dspPrimitiveKind: 'eq3' },
    distortion: { structuralType: 'dsp', domainKind: 'audio.dsp.distortion', dspPrimitiveKind: 'distortion' },
    chorus: { structuralType: 'dsp', domainKind: 'audio.dsp.chorus', dspPrimitiveKind: 'chorus' },
    waveShaper: { structuralType: 'dsp', domainKind: 'audio.dsp.waveShaper', dspPrimitiveKind: 'waveShaper' },
    convolver: { structuralType: 'dsp', domainKind: 'audio.dsp.convolver', dspPrimitiveKind: 'convolver' },
    analyzer: { structuralType: 'metadata', domainKind: 'audio.analysis.analyzer' },
    panner: { structuralType: 'dsp', domainKind: 'audio.dsp.panner', dspPrimitiveKind: 'panner' },
    panner3d: { structuralType: 'dsp', domainKind: 'audio.dsp.panner3d', dspPrimitiveKind: 'panner3d' },
    mixer: { structuralType: 'routing', domainKind: 'audio.routing.mixer', dspPrimitiveKind: 'mixer' },
    auxSend: { structuralType: 'routing', domainKind: 'audio.routing.auxSend' },
    auxReturn: { structuralType: 'routing', domainKind: 'audio.routing.auxReturn' },
    matrixMixer: { structuralType: 'routing', domainKind: 'audio.routing.matrix', dspPrimitiveKind: 'matrixMixer' },
    output: { structuralType: 'interface', domainKind: 'audio.interface.output', dspPrimitiveKind: 'output' },
    math: { structuralType: 'control', domainKind: 'math.expr' },
    compare: { structuralType: 'control', domainKind: 'math.compare' },
    mix: { structuralType: 'control', domainKind: 'math.mix' },
    clamp: { structuralType: 'control', domainKind: 'math.clamp' },
    switch: { structuralType: 'control', domainKind: 'math.switch' },
};

export function getNodeTaxonomy(type: EditorNodeType): NodeTaxonomy {
    return NODE_TAXONOMY[type];
}
