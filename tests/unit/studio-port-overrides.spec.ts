import { describe, expect, it, beforeEach } from 'vitest';

import {
    getStudioNodeDefinition,
    getNodeHandleDescriptors,
    resetStudioNodeCatalogCache,
    resolveStudioPortsForInstance,
    studioDefinitionToHandleDescriptors,
} from '../../ui/editor/nodeCatalog';
import type { OscNodeData } from '../../ui/editor/types';

describe('resolveStudioPortsForInstance', () => {
    beforeEach(() => {
        resetStudioNodeCatalogCache();
    });

    it('falls back to catalog ports when studioPortOverrides is absent', () => {
        const def = getStudioNodeDefinition('osc')!;
        const data: OscNodeData = {
            type: 'osc',
            frequency: 440,
            detune: 0,
            waveform: 'sine',
            label: 'Osc',
        };
        const merged = resolveStudioPortsForInstance(data, def);
        expect(merged.inputs).toEqual(def.inputs);
        expect(merged.outputs).toEqual(def.outputs);
    });

    it('replaces inputs when studioPortOverrides.inputs is set', () => {
        const def = getStudioNodeDefinition('osc')!;
        const data: OscNodeData = {
            type: 'osc',
            frequency: 440,
            detune: 0,
            waveform: 'sine',
            label: 'Osc',
            studioPortOverrides: {
                inputs: [
                    { type: 'float', name: 'frequency', interface: 'slider' },
                    { type: 'float', name: 'extra', interface: 'slider', default: 0, min: 0, max: 1 },
                ],
            },
        };
        const merged = resolveStudioPortsForInstance(data, def);
        expect(merged.inputs).toHaveLength(2);
        expect(merged.inputs[1]?.name).toBe('extra');
        expect(merged.outputs).toEqual(def.outputs);
    });
});

describe('getNodeHandleDescriptors with overrides', () => {
    beforeEach(() => {
        resetStudioNodeCatalogCache();
    });

    it('matches merged ports from resolveStudioPortsForInstance', () => {
        const def = getStudioNodeDefinition('osc')!;
        const data: OscNodeData = {
            type: 'osc',
            frequency: 440,
            detune: 0,
            waveform: 'sine',
            label: 'Osc',
            studioPortOverrides: {
                inputs: [{ type: 'float', name: 'frequency', interface: 'slider' }],
            },
        };
        const merged = resolveStudioPortsForInstance(data, def);
        const fromMerged = studioDefinitionToHandleDescriptors({
            ...def,
            inputs: merged.inputs,
            outputs: merged.outputs,
        });
        expect(getNodeHandleDescriptors(data)).toEqual(fromMerged);
    });
});
