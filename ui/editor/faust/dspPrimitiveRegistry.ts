/**
 * Maps primitive `dspPrimitiveKind` values to Faust import lists and expansion hooks.
 * Single source for palette hints and codegen (`v2/specs/08-primitives-catalog.md`).
 */

export interface DspPrimitiveDefinition {
    kind: string;
    /** Faust `import("…")` paths, deduped at codegen preamble. */
    imports: string[];
    /** Short description for tooling. */
    description: string;
}

const std = 'stdfaust.lib';
const fi = 'filters.lib';

export const DSP_PRIMITIVE_REGISTRY: Record<string, DspPrimitiveDefinition> = {
    osc: { kind: 'osc', imports: [std], description: 'Sine oscillator (os.oscsin)' },
    gain: { kind: 'gain', imports: [std], description: 'Gain / multiply' },
    filter: { kind: 'filter', imports: [std, fi], description: 'Biquad-style lowpass (fi.lowpass)' },
    output: { kind: 'output', imports: [std], description: 'Stereo sink' },
    noise: { kind: 'noise', imports: [std], description: 'Noise source' },
    constant: { kind: 'constant', imports: [std], description: 'DC offset' },
    delay: { kind: 'delay', imports: [std], description: 'Fractional delay' },
    reverb: { kind: 'reverb', imports: [std], description: 'Freeverb-style' },
    compressor: { kind: 'compressor', imports: [std], description: 'Dynamics' },
    phaser: { kind: 'phaser', imports: [std], description: 'Phaser' },
    flanger: { kind: 'flanger', imports: [std], description: 'Flanger' },
    tremolo: { kind: 'tremolo', imports: [std], description: 'Tremolo' },
    eq3: { kind: 'eq3', imports: [std], description: '3-band EQ' },
    distortion: { kind: 'distortion', imports: [std], description: 'Waveshaping' },
    chorus: { kind: 'chorus', imports: [std], description: 'Chorus' },
    waveShaper: { kind: 'waveShaper', imports: [std], description: 'Curve shaper' },
    convolver: { kind: 'convolver', imports: [std], description: 'Convolution' },
    panner: { kind: 'panner', imports: [std], description: 'Stereo pan' },
    panner3d: { kind: 'panner3d', imports: [std], description: '3D pan' },
    mixer: { kind: 'mixer', imports: [std], description: 'Stereo mixer' },
    matrixMixer: { kind: 'matrixMixer', imports: [std], description: 'Matrix router' },
    adsr: { kind: 'adsr', imports: [std], description: 'Envelope' },
};

export function listRegisteredPrimitiveKinds(): string[] {
    return Object.keys(DSP_PRIMITIVE_REGISTRY).sort();
}

export function getPrimitiveDefinition(kind: string | undefined): DspPrimitiveDefinition | undefined {
    if (!kind) return undefined;
    return DSP_PRIMITIVE_REGISTRY[kind];
}
