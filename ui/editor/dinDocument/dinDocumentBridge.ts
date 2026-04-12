/**
 * DinDocument v1 bridge: parse UTF-8 JSON, attach the studio graph under `extensions`,
 * and round-trip without mutating stable node ids.
 */
import type { Edge, Node } from '@xyflow/react';
import {
    DIN_DOCUMENT_FORMAT,
    DIN_DOCUMENT_VERSION,
    STUDIO_GRAPH_EXTENSION_KEY,
} from './constants';
import type { AudioNodeData, GraphDocument } from '../types';

export interface DinDocumentParseSuccess {
    ok: true;
    /** Raw parsed root — shape follows din-core DinDocument v1. */
    value: Record<string, unknown>;
}

export interface DinDocumentParseFailure {
    ok: false;
    code: 'JSON_PARSE_ERROR';
    message: string;
}

export type DinDocumentParseResult = DinDocumentParseSuccess | DinDocumentParseFailure;

/**
 * Parse DinDocument JSON text. Structural validation is delegated to {@link validateDinDocumentWithCore}
 * when din-wasm is loaded.
 */
export function parseDinDocumentJson(text: string): DinDocumentParseResult {
    try {
        const value = JSON.parse(text) as Record<string, unknown>;
        return { ok: true, value };
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, code: 'JSON_PARSE_ERROR', message };
    }
}

export interface StudioGraphExtensionPayload {
    version: 1;
    graph: {
        nodes: unknown[];
        edges: unknown[];
    };
}

/**
 * Embed the active studio graph into a DinDocument-shaped object under `extensions[open-din/studioGraph]`.
 */
export function mergeStudioGraphExtension(
    base: Record<string, unknown>,
    graph: Pick<GraphDocument, 'nodes' | 'edges'>
): Record<string, unknown> {
    const extensions = { ...((base.extensions as Record<string, unknown> | undefined) ?? {}) };
    const payload: StudioGraphExtensionPayload = {
        version: 1,
        graph: {
            nodes: graph.nodes as unknown[],
            edges: graph.edges as unknown[],
        },
    };
    extensions[STUDIO_GRAPH_EXTENSION_KEY] = payload;
    return {
        ...base,
        extensions,
    };
}

/**
 * Build a minimal valid DinDocument v1 shell and attach the studio graph for interchange tests.
 */
export function createMinimalDinDocumentWithStudioGraph(
    graph: Pick<GraphDocument, 'nodes' | 'edges'>
): Record<string, unknown> {
    const base: Record<string, unknown> = {
        format: DIN_DOCUMENT_FORMAT,
        version: DIN_DOCUMENT_VERSION,
        asset: { title: 'DIN Studio' },
        assetRoot: './',
        collections: {
            buffers: [],
            bufferViews: [],
            audioSources: [],
            midiSources: [],
            sampleSlots: [],
            impulses: [],
            dspModules: [],
        },
        defaultSceneId: 'blank',
        scenes: [{ id: 'blank', name: 'Blank Scene' }],
        extensionsUsed: [STUDIO_GRAPH_EXTENSION_KEY],
        extensionsRequired: [],
        extensions: {},
    };
    return mergeStudioGraphExtension(base, graph);
}

/**
 * Serialize a document for persistence. Passes through JSON.stringify semantics (stable key order not guaranteed).
 */
export function serializeDinDocument(doc: Record<string, unknown>): string {
    return `${JSON.stringify(doc, null, 2)}\n`;
}

/**
 * Extract studio nodes/edges from a parsed document, if present.
 */
export function readStudioGraphFromDinDocument(
    doc: Record<string, unknown>
): { nodes: Node<AudioNodeData>[]; edges: Edge[] } | null {
    const ext = doc.extensions as Record<string, unknown> | undefined;
    if (!ext) return null;
    const block = ext[STUDIO_GRAPH_EXTENSION_KEY] as StudioGraphExtensionPayload | undefined;
    if (!block || block.version !== 1 || !block.graph) return null;
    return {
        nodes: block.graph.nodes as Node<AudioNodeData>[],
        edges: block.graph.edges as Edge[],
    };
}
