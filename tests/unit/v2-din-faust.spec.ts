import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
    createMinimalDinDocumentWithStudioGraph,
    mergeStudioGraphExtension,
    parseDinDocumentJson,
    readStudioGraphFromDinDocument,
    serializeDinDocument,
} from '../../ui/editor/dinDocument/dinDocumentBridge';
import { validateDinDocumentWithCore } from '../../core/dinWasmValidation';
import { buildFaustBundleFromGraph } from '../../ui/editor/faust/graphFaustPipeline';
import { compileFaustDspToWasm } from '../../ui/editor/faust/faustCompile';
import { listRegisteredPrimitiveKinds } from '../../ui/editor/faust/dspPrimitiveRegistry';
import { getEditorNodeCatalog, getNodeTaxonomy } from '../../ui/editor/nodeCatalog';
import { canConnect } from '../../ui/editor/nodeHelpers';
import type { AudioNodeData } from '../../ui/editor/types';

const _here = dirname(fileURLToPath(import.meta.url));
const minimalFixture = join(_here, '../../../din-core/fixtures/din-document-v1/minimal.din.json');

describe('DinDocument bridge and din-core WASM', () => {
    it('parses minimal fixture and validates with din-core', async () => {
        const text = readFileSync(minimalFixture, 'utf8');
        const parsed = parseDinDocumentJson(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        const report = await validateDinDocumentWithCore(text);
        expect(report.accepted).toBe(true);
    });

    it('round-trips studio graph extension without changing node ids', () => {
        const nodes: Node<AudioNodeData>[] = [
            {
                id: 'osc_1',
                type: 'oscNode',
                position: { x: 0, y: 0 },
                data: { type: 'osc', frequency: 440, detune: 0, waveform: 'sine', label: 'Osc' },
            },
        ];
        const edges: Edge[] = [];
        const doc = createMinimalDinDocumentWithStudioGraph({ nodes, edges });
        const text = serializeDinDocument(doc);
        const again = parseDinDocumentJson(text);
        expect(again.ok).toBe(true);
        if (!again.ok) return;
        const round = mergeStudioGraphExtension(again.value, { nodes, edges });
        const g = readStudioGraphFromDinDocument(round);
        expect(g?.nodes[0]?.id).toBe('osc_1');
    });

    it('surfaces JSON parse errors', () => {
        const bad = parseDinDocumentJson('{');
        expect(bad.ok).toBe(false);
        if (bad.ok) return;
        expect(bad.code).toBe('JSON_PARSE_ERROR');
    });
});

describe('Faust registry and codegen', () => {
    it('lists deterministic primitive kinds', () => {
        const kinds = listRegisteredPrimitiveKinds();
        expect(kinds).toContain('gain');
        expect(kinds).toContain('osc');
    });

    it('emits a single process line for osc→gain→output', () => {
        const nodes: Node<AudioNodeData>[] = [
            {
                id: 'a',
                type: 'oscNode',
                position: { x: 0, y: 0 },
                data: { type: 'osc', frequency: 220, detune: 0, waveform: 'sine', label: 'O' },
            },
            {
                id: 'b',
                type: 'gainNode',
                position: { x: 0, y: 0 },
                data: { type: 'gain', gain: 0.25, label: 'G' },
            },
            {
                id: 'c',
                type: 'outputNode',
                position: { x: 0, y: 0 },
                data: { type: 'output', playing: false, masterGain: 1, label: 'Out' },
            },
        ];
        const edges: Edge[] = [
            { id: 'e1', source: 'a', target: 'b', sourceHandle: 'out', targetHandle: 'in' },
            { id: 'e2', source: 'b', target: 'c', sourceHandle: 'out', targetHandle: 'in' },
        ];
        const bundle = buildFaustBundleFromGraph(nodes, edges, 'test');
        expect(bundle.diagnostics.length).toBe(0);
        const lines = bundle.faust.split('\n').filter((l) => l.startsWith('process ='));
        expect(lines).toHaveLength(1);
        expect(bundle.manifest.params.length).toBeGreaterThan(0);
    });

    it('compiles generated Faust with @grame/faustwasm', async () => {
        const nodes: Node<AudioNodeData>[] = [
            {
                id: 'a',
                type: 'oscNode',
                position: { x: 0, y: 0 },
                data: { type: 'osc', frequency: 220, detune: 0, waveform: 'sine', label: 'O' },
            },
            {
                id: 'c',
                type: 'outputNode',
                position: { x: 0, y: 0 },
                data: { type: 'output', playing: false, masterGain: 1, label: 'Out' },
            },
        ];
        const edges: Edge[] = [{ id: 'e1', source: 'a', target: 'c', sourceHandle: 'out', targetHandle: 'in' }];
        const { faust } = buildFaustBundleFromGraph(nodes, edges, 'compile-smoke');
        const res = await compileFaustDspToWasm('smoke', faust);
        expect(res.ok).toBe(true);
        if (!res.ok) return;
        expect(res.dspJson.length).toBeGreaterThan(10);
    });
});

describe('Node catalog taxonomy', () => {
    it('gives every catalog entry structural type and domain kind', () => {
        for (const entry of getEditorNodeCatalog()) {
            const t = getNodeTaxonomy(entry.type);
            expect(t.structuralType.length).toBeGreaterThan(2);
            expect(t.domainKind).toMatch(/\./);
        }
    });
});

describe('Audio fan-in policy', () => {
    it('rejects a second edge to the same FX input when edges are provided', () => {
        const nodes: Node<AudioNodeData>[] = [
            {
                id: 'o1',
                type: 'oscNode',
                position: { x: 0, y: 0 },
                data: { type: 'osc', frequency: 440, detune: 0, waveform: 'sine', label: 'A' },
            },
            {
                id: 'o2',
                type: 'oscNode',
                position: { x: 0, y: 0 },
                data: { type: 'osc', frequency: 220, detune: 0, waveform: 'sine', label: 'B' },
            },
            {
                id: 'g1',
                type: 'gainNode',
                position: { x: 0, y: 0 },
                data: { type: 'gain', gain: 0.5, label: 'G' },
            },
        ];
        const nodeById = new Map(nodes.map((n) => [n.id, n]));
        const existing: Edge[] = [{ id: 'x', source: 'o1', target: 'g1', sourceHandle: 'out', targetHandle: 'in' }];
        const next = {
            source: 'o2',
            target: 'g1',
            sourceHandle: 'out',
            targetHandle: 'in',
        };
        expect(canConnect(next, nodeById, existing)).toBe(false);
    });
});
