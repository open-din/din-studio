import { generateCode } from '../ui/editor/CodeGenerator';
import { buildFaustBundleFromGraph } from '../ui/editor/faust/graphFaustPipeline';
import type { FaustCompileManifest } from '../ui/editor/faust/compileManifest';
import type { GraphDocument } from '../ui/editor/store';
import {
    graphDocumentToPatch,
    migratePatchDocument,
    patchToGraphDocument,
    type PatchDocument,
} from '@open-din/react/patch';
import type { OfflinePatchSummary, OfflinePatchValidation } from './types';

function patchDocumentToStudioGraph(patch: PatchDocument): GraphDocument {
    return patchToGraphDocument(patch) as unknown as GraphDocument;
}

export function summarizePatch(patch: PatchDocument): OfflinePatchSummary {
    return {
        name: patch.name,
        version: patch.version,
        nodeCount: patch.nodes.length,
        connectionCount: patch.connections.length,
        inputCount: patch.interface.inputs.length,
        eventCount: patch.interface.events.length,
        midiInputCount: patch.interface.midiInputs.length,
        midiOutputCount: patch.interface.midiOutputs.length,
    };
}

export function normalizeOfflinePatch(patch: PatchDocument): OfflinePatchValidation {
    const migrated = migratePatchDocument(patch);
    const normalizedPatch = graphDocumentToPatch(patchDocumentToStudioGraph(migrated));
    const normalizedText = `${JSON.stringify(normalizedPatch, null, 2)}\n`;

    return {
        ok: true,
        patch: normalizedPatch,
        normalizedText,
        summary: summarizePatch(normalizedPatch),
    };
}

export function validateOfflinePatchText(text: string): OfflinePatchValidation {
    const parsed = JSON.parse(text) as PatchDocument;
    return normalizeOfflinePatch(parsed);
}

export function generateCodeFromOfflinePatch(
    patch: PatchDocument,
    graphName?: string,
    includeProvider = false,
): string {
    const graph = patchDocumentToStudioGraph(patch);
    return generateCode(graph.nodes, graph.edges, includeProvider, graphName ?? graph.name);
}

export interface OfflineFaustBundle {
    faust: string;
    manifest: FaustCompileManifest;
    diagnostics: string[];
}

/**
 * Faust DSP + compile manifest aligned with the same graph as {@link generateCodeFromOfflinePatch}.
 */
export function generateFaustBundleFromOfflinePatch(patch: PatchDocument, graphName?: string): OfflineFaustBundle {
    const graph = patchDocumentToStudioGraph(patch);
    return buildFaustBundleFromGraph(graph.nodes, graph.edges, graphName ?? graph.name);
}
