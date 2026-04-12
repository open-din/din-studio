import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

import {
    categorySlugToCategoryLabel,
    getStudioDspHintForEditorType,
    getStudioDspSource,
    getStudioNodeDefinition,
    getStudioSourceHandleIds,
    getStudioTargetHandleIds,
    humanizeStudioNodeName,
    loadBuiltInNodeRawDefinitions,
    loadStudioNodeCatalog,
    normalizeStudioNodeDefinition,
    resetStudioNodeCatalogCache,
    resolveDefaultStudioTitle,
    resolveStudioCustomComponentKey,
    slugToCatalogLabel,
    subcategorySlugToLabel,
    validateStudioNodeDefinition,
} from '../../ui/editor/nodeCatalog';
import { STUDIO_NODE_CUSTOM_VIEWS } from '../../ui/editor/nodeCustomViews/registry';
import { parseFaustHsliders } from '../../ui/editor/nodeCatalog/parseFaustHsliders';

describe('Studio node UI catalog', () => {
    it('maps category and subcategory slugs to palette labels', () => {
        expect(categorySlugToCategoryLabel('audio')).toBe('AUDIO');
        expect(categorySlugToCategoryLabel('sources')).toBe('Sources');
        expect(categorySlugToCategoryLabel('routing')).toBe('Routing');
        expect(categorySlugToCategoryLabel('math')).toBe('Math');
        expect(categorySlugToCategoryLabel('midi')).toBe('MIDI');
        expect(slugToCatalogLabel('envelopes-and-modulation')).toBe('Envelopes And Modulation');
        expect(subcategorySlugToLabel('generators')).toBe('Generators');
        expect(subcategorySlugToLabel('gain-mix-and-stereo-dsp')).toBe('Gain, Mix, and Stereo DSP');
        expect(subcategorySlugToLabel('sequencers')).toBe('Sequencers');
    });

    it('parses YAML to the same normalized shape as an inline object for a minimal dsp node', () => {
        const yaml = `
name: yaml_osc
description: Test
type: dsp
tags: [test]
customComponent: null
inputs:
  - { type: float, name: frequency, interface: slider }
outputs:
  - { type: audio, name: out, interface: input }
dsp: |
  import("stdfaust.lib");
  process = os.oscsin(440);
`;
        const fromYaml = normalizeStudioNodeDefinition({
            ...(parseYaml(yaml) as Record<string, unknown>),
            category: 'AUDIO',
            subcategory: 'Generators',
        });
        const inline = normalizeStudioNodeDefinition({
            name: 'yaml_osc',
            description: 'Test',
            type: 'dsp',
            tags: ['test'],
            customComponent: null,
            inputs: [{ type: 'float', name: 'frequency', interface: 'slider' }],
            outputs: [{ type: 'audio', name: 'out', interface: 'input' }],
            category: 'AUDIO',
            subcategory: 'Generators',
            dsp: 'import("stdfaust.lib");\nprocess = os.oscsin(440);\n',
        });
        expect(fromYaml.name).toBe(inline.name);
        expect(fromYaml.dsp?.trim()).toBe(inline.dsp?.trim());
        expect(validateStudioNodeDefinition(fromYaml).ok).toBe(true);
    });

    it('loads built-in node YAML files with path-derived taxonomy', () => {
        const raw = loadBuiltInNodeRawDefinitions();
        const osc = raw.find((r) => r.name === 'osc');
        expect(osc?.category).toBe('AUDIO');
        expect(osc?.subcategory).toBe('Generators');
        expect(String(osc?.dsp ?? '').includes('os.oscsin')).toBe(true);
    });

    it('exposes non-audio built-in rows with correct category and dsp rules', () => {
        resetStudioNodeCatalogCache();
        const transport = getStudioNodeDefinition('transport');
        expect(transport?.category).toBe('Sources');
        expect(transport?.subcategory).toBe('Transport');
        expect(transport?.type).toBe('transport');
        expect(getStudioDspSource(transport!)).toBeUndefined();

        const output = getStudioNodeDefinition('output');
        expect(output?.category).toBe('Routing');
        expect(output?.subcategory).toBe('Output');
        expect(output?.type).toBe('interface');

        const mixer = getStudioNodeDefinition('mixer');
        expect(mixer?.category).toBe('Routing');
        expect(mixer?.type).toBe('dsp');
        expect(getStudioDspSource(mixer!)?.trim()).toBe('process = _,_;');

        const math = getStudioNodeDefinition('math');
        expect(math?.category).toBe('Math');
        expect(math?.type).toBe('value');
        expect(getStudioDspSource(math!)).toBeUndefined();

        const sampler = getStudioNodeDefinition('sampler');
        expect(sampler?.category).toBe('Sources');
        expect(sampler?.type).toBe('asset');
        expect(sampler?.customComponent).toBe('sampler');
        expect(getStudioDspSource(sampler!)).toBeUndefined();
    });

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
        expect(def.editableInputsParams).toBe(false);
        expect(def.editableOutputsParams).toBe(false);
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

    it('fills float port min/max/default/step from dsp hslider when omitted in YAML', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'hslider_merge',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'dsp',
            inputs: [{ type: 'float', name: 'frequency', interface: 'slider' }],
            outputs: [{ type: 'audio', name: 'out', interface: 'input' }],
            dsp: 'import("stdfaust.lib");\nprocess = os.oscsin(hslider("frequency", 440, 20, 20000, 0.001));',
        });
        const freq = def.inputs.find((i) => i.name === 'frequency');
        expect(freq?.default).toBe(440);
        expect(freq?.min).toBe(20);
        expect(freq?.max).toBe(20000);
        expect(freq?.step).toBe(0.001);
    });

    it('does not override explicit YAML port bounds when merging dsp hslider', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'explicit_bounds',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'dsp',
            inputs: [{ type: 'float', name: 'frequency', interface: 'slider', min: 5, max: 10000 }],
            outputs: [{ type: 'audio', name: 'out', interface: 'input' }],
            dsp: 'process = os.oscsin(hslider("frequency", 440, 20, 20000, 0.001));',
        });
        const freq = def.inputs.find((i) => i.name === 'frequency');
        expect(freq?.min).toBe(5);
        expect(freq?.max).toBe(10000);
    });

    it('parseFaustHsliders exposes path labels and tail keys for matching ports', () => {
        const m = parseFaustHsliders('n = hslider("v/n_osc_1/frequency", 220, 20, 20000, 0.01);');
        expect(m.get('frequency')?.default).toBe(220);
        expect(m.get('v/n_osc_1/frequency')?.min).toBe(20);
    });

    it('built-in osc catalog row picks up hslider ranges from dsp block', () => {
        resetStudioNodeCatalogCache();
        const osc = getStudioNodeDefinition('osc');
        expect(osc).toBeDefined();
        const freq = osc?.inputs.find((i) => i.name === 'frequency');
        const det = osc?.inputs.find((i) => i.name === 'detune');
        expect(freq?.min).toBe(20);
        expect(freq?.max).toBe(20000);
        expect(freq?.default).toBe(440);
        expect(freq?.step).toBe(0.001);
        expect(det?.min).toBe(-100);
        expect(det?.max).toBe(100);
        expect(det?.step).toBe(0.01);
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

    it('normalizes port type alias number to float', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'n',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'value',
            inputs: [{ type: 'number', name: 'x', interface: 'slider' } as { type: string; name: string; interface: 'slider' }],
            outputs: [],
        });
        expect(def.inputs[0]?.type).toBe('float');
        expect(validateStudioNodeDefinition(def).ok).toBe(true);
    });

    it('rejects enum ports without enumOptions', () => {
        const def = normalizeStudioNodeDefinition({
            name: 'e',
            description: 'd',
            category: 'C',
            subcategory: 'S',
            type: 'value',
            inputs: [{ type: 'enum', name: 'mode', interface: 'input' }],
            outputs: [],
        });
        expect(validateStudioNodeDefinition(def).ok).toBe(false);
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

    it('maps every non-null catalog customComponent to STUDIO_NODE_CUSTOM_VIEWS', () => {
        resetStudioNodeCatalogCache();
        for (const def of loadStudioNodeCatalog()) {
            const key = def.customComponent;
            if (key === null) continue;
            expect(
                STUDIO_NODE_CUSTOM_VIEWS[key],
                `node "${def.name}" customComponent "${key}" is not registered in ui/editor/nodeCustomViews/registry.tsx`,
            ).toBeDefined();
        }
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

    const phase1AudioDspNames = [
        'osc',
        'noise',
        'lfo',
        'adsr',
        'filter',
        'gain',
        'panner',
        'compressor',
        'distortion',
        'delay',
        'reverb',
        'chorus',
        'flanger',
        'analyzer',
    ] as const;

    it('Phase 1 AUDIO Faust catalog rows validate and expose dsp', () => {
        resetStudioNodeCatalogCache();
        for (const name of phase1AudioDspNames) {
            const def = getStudioNodeDefinition(name);
            expect(def, name).toBeDefined();
            if (!def) continue;
            expect(def.category).toBe('AUDIO');
            expect(def.type).toBe('dsp');
            expect(validateStudioNodeDefinition(def).ok).toBe(true);
            expect(getStudioDspSource(def)?.trim().length ?? 0).toBeGreaterThan(0);
            expect(getStudioDspHintForEditorType(name)?.trim().length ?? 0).toBeGreaterThan(0);
        }
    });
});
