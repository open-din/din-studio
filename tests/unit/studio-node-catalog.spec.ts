import { describe, expect, it } from 'vitest';

import {
    getStudioDspHintForEditorType,
    getStudioDspSource,
    getStudioNodeDefinition,
    getStudioSourceHandleIds,
    getStudioTargetHandleIds,
    humanizeStudioNodeName,
    normalizeStudioNodeDefinition,
    resetStudioNodeCatalogCache,
    resolveDefaultStudioTitle,
    resolveStudioCustomComponentKey,
    validateStudioNodeDefinition,
} from '../../ui/editor/studioNodeCatalog';

describe('Studio node UI catalog', () => {
    it('normalizes optional fields to §10 defaults', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'test_node',
            description: 'd',
            category: 'Cat',
            subcategory: 'Sub',
            type: 'transport',
        });
        expect(def.label).toBeNull();
        expect(def.customComponent).toBeNull();
        expect(def.tags).toEqual([]);
        expect(def.inputs).toEqual([]);
        expect(def.outputs).toEqual([]);
    });

    it('accepts a minimal non-DSP definition after normalization', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'tr',
            description: 'desc',
            category: 'C',
            subcategory: 'S',
            type: 'transport',
        });
        const v = validateStudioNodeDefinition(def);
        expect(v.ok).toBe(true);
    });

    it('accepts a minimal DSP definition with non-empty dsp', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'dsp1',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'dsp',
            dsp: 'process = _;',
        });
        const v = validateStudioNodeDefinition(def);
        expect(v.ok).toBe(true);
    });

    it('rejects dsp nodes without dsp or with empty dsp', () => {
        const noDsp = normalizeStudioNodeDefinition({
            name: 'x',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'dsp',
        });
        expect(validateStudioNodeDefinition(noDsp).ok).toBe(false);

        const emptyDsp = normalizeStudioNodeDefinition({
            name: 'y',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'dsp',
            dsp: '   ',
        });
        expect(validateStudioNodeDefinition(emptyDsp).ok).toBe(false);
    });

    it('rejects non-dsp rows that still carry dsp', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'bad',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'transport',
        });
        const withDsp = { ...def, dsp: 'process = _;' };
        const v = validateStudioNodeDefinition(withDsp);
        expect(v.ok).toBe(false);
    });

    it('rejects duplicate port names within inputs or outputs', () => {
        const base = {
            name: 'p',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'transport' as const,
            label: null,
            customComponent: null,
            tags: [] as string[],
        };
        const dupIn = {
            ...base,
            inputs: [
                { type: 'float' as const, name: 'a', interface: 'slider' as const },
                { type: 'float' as const, name: 'a', interface: 'slider' as const },
            ],
            outputs: [],
        };
        expect(validateStudioNodeDefinition(dupIn).ok).toBe(false);
    });

    it('maps React Flow handle ids to port names', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'n',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'transport',
            inputs: [{ type: 'float', name: 'in1', interface: 'slider' }],
            outputs: [{ type: 'audio', name: 'out1', interface: 'input' }],
        });
        expect(validateStudioNodeDefinition(def).ok).toBe(true);
        expect(getStudioTargetHandleIds(def)).toEqual(['in1']);
        expect(getStudioSourceHandleIds(def)).toEqual(['out1']);
    });

    it('uses humanized name when label is null', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'low_pass',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'value',
        });
        expect(resolveDefaultStudioTitle(def)).toBe('Low Pass');
        expect(humanizeStudioNodeName('low_pass')).toBe('Low Pass');
    });

    it('resolves customComponent key for shell selection', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'c',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'value',
            customComponent: 'MyKey',
        });
        expect(resolveStudioCustomComponentKey(def)).toBe('MyKey');
        const nullComp = { ...def, customComponent: null };
        expect(resolveStudioCustomComponentKey(nullComp)).toBeNull();
    });

    it('exposes Faust dsp only for dsp types via catalog helpers', () => {
        const dspDef = normalizeStudioNodeDefinition({
            name: 'd',
            description: 'x',
            category: 'C',
            subcategory: 'S',
            type: 'dsp',
            dsp: 'process = +;',
        });
        expect(getStudioDspSource(dspDef)).toBe('process = +;');

        const tr = normalizeStudioNodeDefinition({
            name: 't',
            description: 'x',
            category: 'C',
            subcategory: 'S',
            type: 'transport',
        });
        expect(getStudioDspSource(tr)).toBeUndefined();
    });

    it('returns undefined dsp hint when editor type is unknown', () => {
        expect(getStudioDspHintForEditorType('__no_such_node__')).toBeUndefined();
    });

    it('returns stable catalog rows for the same name across cache resets', () => {
        resetStudioNodeCatalogCache();
        const a = getStudioNodeDefinition('osc');
        resetStudioNodeCatalogCache();
        const b = getStudioNodeDefinition('osc');
        expect(a).toEqual(b);
    });
});
