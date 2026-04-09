import { readFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import type { EditorOperation, EditorSessionState, OfflinePatchValidation } from '../../../../core';
import { validateOfflinePatchText } from '../../../../core';
import type { McpToolResult } from './types';

export function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
}

export function asOptionalString(args: Record<string, unknown>, key: string): string | undefined {
    const value = args[key];
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`"${key}" must be a non-empty string.`);
    }
    return value.trim();
}

export function asOptionalBoolean(args: Record<string, unknown>, key: string): boolean | undefined {
    const value = args[key];
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'boolean') {
        throw new Error(`"${key}" must be a boolean.`);
    }
    return value;
}

export function asOperations(args: Record<string, unknown>): EditorOperation[] {
    const value = args.operations;
    if (!Array.isArray(value)) {
        throw new Error('"operations" must be an array.');
    }
    return value as EditorOperation[];
}

export function jsonText(value: unknown): string {
    return `${JSON.stringify(value, null, 2)}\n`;
}

export function toolSuccess(text: string, structuredContent?: unknown): McpToolResult {
    return {
        content: [{ type: 'text', text }],
        structuredContent,
    };
}

export function toolFailure(message: string, structuredContent?: unknown): McpToolResult {
    return {
        content: [{ type: 'text', text: message }],
        structuredContent,
        isError: true,
    };
}

export function graphSummary(graph: EditorSessionState['graphs'][number]) {
    return {
        id: graph.id,
        name: graph.name,
        order: graph.order,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        updatedAt: graph.updatedAt,
    };
}

export function resolveGraph(state: EditorSessionState, graphId?: string | null) {
    const resolvedGraphId = graphId ?? state.activeGraphId;
    if (!resolvedGraphId) {
        throw new Error('No active graph is available.');
    }
    const graph = state.graphs.find((entry) => entry.id === resolvedGraphId);
    if (!graph) {
        throw new Error(`Graph "${resolvedGraphId}" was not found.`);
    }
    return graph;
}

export function guessMimeType(filePath: string): string {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.wav')) return 'audio/wav';
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.ogg')) return 'audio/ogg';
    if (lower.endsWith('.flac')) return 'audio/flac';
    if (lower.endsWith('.aiff') || lower.endsWith('.aif')) return 'audio/aiff';
    return 'application/octet-stream';
}

export function assertPatchFilePath(filePath: string, label: string): string {
    const resolved = resolvePath(process.cwd(), filePath);
    if (!resolved.endsWith('.json') && !resolved.endsWith('.patch.json')) {
        throw new Error(`"${label}" must point to a JSON patch file.`);
    }
    return resolved;
}

export function offlinePatchUri(filePath: string): string {
    return `din-studio://offline/patch/${encodeURIComponent(filePath)}`;
}

export function decodeOfflinePatchUri(uri: string): string {
    const parsed = new URL(uri);
    if (parsed.hostname !== 'offline') {
        throw new Error(`Unsupported offline resource "${uri}".`);
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'patch' || parts.length < 2) {
        throw new Error(`Unsupported offline resource "${uri}".`);
    }
    return decodeURIComponent(parts.slice(1).join('/'));
}

export async function readPatchValidation(args: Record<string, unknown>): Promise<{ path?: string; validation: OfflinePatchValidation }> {
    const inputPath = asOptionalString(args, 'path');
    const inputText = asOptionalString(args, 'text');

    if (!inputPath && !inputText) {
        throw new Error('Provide either "path" or "text".');
    }
    if (inputPath && inputText) {
        throw new Error('Provide only one of "path" or "text".');
    }

    if (inputPath) {
        const resolvedPath = assertPatchFilePath(inputPath, 'path');
        const text = await readFile(resolvedPath, 'utf8');
        return {
            path: resolvedPath,
            validation: validateOfflinePatchText(text),
        };
    }

    return {
        validation: validateOfflinePatchText(inputText!),
    };
}
