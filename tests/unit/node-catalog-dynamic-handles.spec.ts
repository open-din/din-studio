import type { Node } from '@xyflow/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { getNodeHandleDescriptors } from '../../ui/editor/nodeCatalog';
import {
    getStudioNodeDefinition,
    resetStudioNodeCatalogCache,
    studioDefinitionToHandleDescriptors,
} from '../../ui/editor/nodeCatalog';
import {
    canConnect,
    getConnectionEdgeStyle,
    studioPortValueTypesConnectable,
} from '../../ui/editor/nodeHelpers';
import type {
    ADSRNodeData,
    AudioNodeData,
    CompressorNodeData,
    InputNodeData,
    OscNodeData,
    PhaserNodeData,
    VoiceNodeData,
} from '../../ui/editor/types';

describe('studioPortValueTypesConnectable', () => {
    it('allows same kind and int/float CV pairing', () => {
        expect(studioPortValueTypesConnectable('float', 'float')).toBe(true);
        expect(studioPortValueTypesConnectable('trigger', 'trigger')).toBe(true);
        expect(studioPortValueTypesConnectable('audio', 'audio')).toBe(true);
        expect(studioPortValueTypesConnectable('int', 'float')).toBe(true);
        expect(studioPortValueTypesConnectable('float', 'int')).toBe(true);
    });

    it('rejects unlike kinds', () => {
        expect(studioPortValueTypesConnectable('trigger', 'float')).toBe(false);
        expect(studioPortValueTypesConnectable('audio', 'float')).toBe(false);
    });
});

describe('getNodeHandleDescriptors (Studio catalog)', () => {
    beforeEach(() => {
        resetStudioNodeCatalogCache();
    });

    it('matches studioDefinitionToHandleDescriptors for compressor', () => {
        const def = getStudioNodeDefinition('compressor');
        expect(def).toBeDefined();
        const fromCatalog = studioDefinitionToHandleDescriptors(def!);
        const data: CompressorNodeData = {
            type: 'compressor',
            threshold: -24,
            knee: 30,
            ratio: 12,
            attack: 0.003,
            release: 0.25,
            sidechainStrength: 0.7,
            label: 'Compressor',
        };
        expect(getNodeHandleDescriptors(data)).toEqual(fromCatalog);
    });

    it('uses YAML sidechain labels for compressor', () => {
        const def = getStudioNodeDefinition('compressor')!;
        const h = studioDefinitionToHandleDescriptors(def);
        expect(h.find((x) => x.id === 'sidechainIn')?.label).toBe('Sidechain');
        expect(h.find((x) => x.id === 'sidechainStrength')?.label).toBe('SC Amt');
    });

    it('matches studioDefinitionToHandleDescriptors for osc', () => {
        const def = getStudioNodeDefinition('osc')!;
        const data: OscNodeData = {
            type: 'osc',
            frequency: 440,
            detune: 0,
            waveform: 'sine',
            label: 'Osc',
        };
        expect(getNodeHandleDescriptors(data)).toEqual(studioDefinitionToHandleDescriptors(def));
        const h = studioDefinitionToHandleDescriptors(def);
        expect(h.find((x) => x.id === 'out')?.label).toBe('Audio Out');
        expect(h.find((x) => x.id === 'frequency')?.label).toBe('Freq');
    });

    it('uses YAML for phaser (no legacy default fallback)', () => {
        const def = getStudioNodeDefinition('phaser');
        expect(def).toBeDefined();
        const data: PhaserNodeData = {
            type: 'phaser',
            rate: 0.5,
            depth: 0.5,
            feedback: 0.7,
            baseFrequency: 1000,
            stages: 4,
            mix: 0.5,
            label: 'Phaser',
        };
        expect(getNodeHandleDescriptors(data)).toEqual(studioDefinitionToHandleDescriptors(def!));
    });

    it('includes portValueType and portInterface from YAML on descriptors', () => {
        const def = getStudioNodeDefinition('osc')!;
        const h = studioDefinitionToHandleDescriptors(def);
        const freq = h.find((x) => x.id === 'frequency');
        expect(freq?.portValueType).toBe('float');
        expect(freq?.portInterface).toBe('slider');
        const out = h.find((x) => x.id === 'out');
        expect(out?.portValueType).toBe('audio');
        expect(out?.direction).toBe('source');
    });

    it('derives dynamic handle types from node parameter objects', () => {
        const data: InputNodeData = {
            type: 'input',
            label: 'Input',
            params: [
                { id: 'cutoff', name: 'cutoff', label: 'Cutoff', type: 'float', value: 0, defaultValue: 0, min: 0, max: 1 },
                { id: 'gate', name: 'gate', label: 'Gate', type: 'trigger', value: 0, defaultValue: 0, min: 0, max: 1 },
                { id: 'mic', name: 'mic', label: 'Mic', type: 'audio', value: 0, defaultValue: 0, min: 0, max: 1, audioSource: 'mic' },
            ],
        };

        const handles = getNodeHandleDescriptors(data);
        expect(handles.find((x) => x.id === 'param:cutoff')?.portValueType).toBe('float');
        expect(handles.find((x) => x.id === 'param:gate')?.portValueType).toBe('trigger');
        expect(handles.find((x) => x.id === 'param:mic')?.portValueType).toBe('audio');
    });

    it('allows same catalog port types (float CV) and sets edge style from source port', () => {
        resetStudioNodeCatalogCache();
        const voiceData: VoiceNodeData = {
            type: 'voice',
            portamento: 0,
            label: 'Voice',
        };
        const oscData: OscNodeData = {
            type: 'osc',
            frequency: 440,
            detune: 0,
            waveform: 'sine',
            label: 'Osc',
        };
        const voiceNode = { id: 'v1', type: 'voiceNode', position: { x: 0, y: 0 }, data: voiceData } as Node<AudioNodeData>;
        const oscNode = { id: 'o1', type: 'oscNode', position: { x: 0, y: 0 }, data: oscData } as Node<AudioNodeData>;
        const nodeById = new Map<string, Node<AudioNodeData>>([
            [voiceNode.id, voiceNode],
            [oscNode.id, oscNode],
        ]);
        const ok = canConnect(
            { source: 'v1', target: 'o1', sourceHandle: 'note', targetHandle: 'frequency' },
            nodeById,
        );
        expect(ok).toBe(true);
        const style = getConnectionEdgeStyle(
            { source: 'v1', target: 'o1', sourceHandle: 'note', targetHandle: 'frequency' },
            nodeById,
        );
        expect(style.stroke).toBe('#4F75FF');
        expect(style.strokeWidth).toBe(2);
        expect(style.strokeDasharray).toBe('5,5');
    });

    it('rejects catalog float target when source catalog port is trigger (no legacy path)', () => {
        resetStudioNodeCatalogCache();
        const voiceData: VoiceNodeData = {
            type: 'voice',
            portamento: 0,
            label: 'Voice',
        };
        const oscData: OscNodeData = {
            type: 'osc',
            frequency: 440,
            detune: 0,
            waveform: 'sine',
            label: 'Osc',
        };
        const voiceNode = { id: 'v1', type: 'voiceNode', position: { x: 0, y: 0 }, data: voiceData } as Node<AudioNodeData>;
        const oscNode = { id: 'o1', type: 'oscNode', position: { x: 0, y: 0 }, data: oscData } as Node<AudioNodeData>;
        const nodeById = new Map<string, Node<AudioNodeData>>([
            [voiceNode.id, voiceNode],
            [oscNode.id, oscNode],
        ]);
        expect(
            canConnect({ source: 'v1', target: 'o1', sourceHandle: 'gate', targetHandle: 'frequency' }, nodeById),
        ).toBe(false);
    });

    it('allows audio to named audio inputs (e.g. compressor sidechain) via catalog types', () => {
        resetStudioNodeCatalogCache();
        const oscData: OscNodeData = {
            type: 'osc',
            frequency: 440,
            detune: 0,
            waveform: 'sine',
            label: 'Osc',
        };
        const compData: CompressorNodeData = {
            type: 'compressor',
            threshold: -24,
            knee: 30,
            ratio: 12,
            attack: 0.003,
            release: 0.25,
            sidechainStrength: 0.7,
            label: 'Comp',
        };
        const oscNode = { id: 'o1', type: 'oscNode', position: { x: 0, y: 0 }, data: oscData } as Node<AudioNodeData>;
        const compNode = { id: 'c1', type: 'compressorNode', position: { x: 0, y: 0 }, data: compData } as Node<AudioNodeData>;
        const nodeById = new Map<string, Node<AudioNodeData>>([
            [oscNode.id, oscNode],
            [compNode.id, compNode],
        ]);
        expect(
            canConnect(
                { source: 'o1', target: 'c1', sourceHandle: 'out', targetHandle: 'sidechainIn' },
                nodeById,
            ),
        ).toBe(true);
    });

    it('colors trigger edges from catalog source port', () => {
        resetStudioNodeCatalogCache();
        const voiceData: VoiceNodeData = {
            type: 'voice',
            portamento: 0,
            label: 'Voice',
        };
        const adsrData: ADSRNodeData = {
            type: 'adsr',
            attack: 0.01,
            decay: 0.1,
            sustain: 0.7,
            release: 0.2,
            label: 'ADSR',
        };
        const voiceNode = { id: 'v1', type: 'voiceNode', position: { x: 0, y: 0 }, data: voiceData } as Node<AudioNodeData>;
        const adsrNode = { id: 'a1', type: 'adsrNode', position: { x: 0, y: 0 }, data: adsrData } as Node<AudioNodeData>;
        const nodeById = new Map<string, Node<AudioNodeData>>([
            [voiceNode.id, voiceNode],
            [adsrNode.id, adsrNode],
        ]);
        const style = getConnectionEdgeStyle(
            { source: 'v1', target: 'a1', sourceHandle: 'gate', targetHandle: 'gate' },
            nodeById,
        );
        expect(style.stroke).toBe('#FF5F58');
        expect(style.strokeWidth).toBe(2);
    });

    it('uses corrected catalog kinds for modulation and transport wiring', () => {
        resetStudioNodeCatalogCache();
        const lfoNode = {
            id: 'lfo-1',
            type: 'lfoNode',
            position: { x: 0, y: 0 },
            data: { type: 'lfo', rate: 1, depth: 0.5, waveform: 'sine', label: 'LFO' } as AudioNodeData,
        } as Node<AudioNodeData>;
        const adsrNode = {
            id: 'adsr-1',
            type: 'adsrNode',
            position: { x: 0, y: 0 },
            data: { type: 'adsr', attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2, label: 'ADSR' } as ADSRNodeData,
        } as Node<AudioNodeData>;
        const gainNode = {
            id: 'gain-1',
            type: 'gainNode',
            position: { x: 0, y: 0 },
            data: { type: 'gain', gain: 0.5, label: 'Gain' } as AudioNodeData,
        } as Node<AudioNodeData>;
        const stepSequencerNode = {
            id: 'seq-1',
            type: 'stepSequencerNode',
            position: { x: 0, y: 0 },
            data: { type: 'stepSequencer', steps: 4, pattern: [1, 0, 0, 0], activeSteps: [true, false, false, false], label: 'Seq' } as AudioNodeData,
        } as Node<AudioNodeData>;
        const transportNode = {
            id: 'transport-1',
            type: 'transportNode',
            position: { x: 0, y: 0 },
            data: { type: 'transport', bpm: 120, playing: false, beatsPerBar: 4, beatUnit: 4, stepsPerBeat: 4, barsPerPhrase: 4, swing: 0, label: 'Transport' } as AudioNodeData,
        } as Node<AudioNodeData>;
        const nodeById = new Map<string, Node<AudioNodeData>>([
            [lfoNode.id, lfoNode],
            [adsrNode.id, adsrNode],
            [gainNode.id, gainNode],
            [stepSequencerNode.id, stepSequencerNode],
            [transportNode.id, transportNode],
        ]);

        expect(canConnect({ source: 'lfo-1', target: 'gain-1', sourceHandle: 'out', targetHandle: 'gain' }, nodeById)).toBe(true);
        expect(canConnect({ source: 'adsr-1', target: 'gain-1', sourceHandle: 'envelope', targetHandle: 'gain' }, nodeById)).toBe(true);
        expect(canConnect({ source: 'transport-1', target: 'seq-1', sourceHandle: 'out', targetHandle: 'transport' }, nodeById)).toBe(true);
        expect(canConnect({ source: 'lfo-1', target: 'gain-1', sourceHandle: 'out', targetHandle: 'in' }, nodeById)).toBe(false);
    });
});
