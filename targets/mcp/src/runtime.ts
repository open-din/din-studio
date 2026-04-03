import { basename, resolve as resolvePath } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import type {
    BridgeApplyOperationsRequest,
    BridgeAssetIngestRequest,
    BridgeAssetIngestResponse,
    BridgeCodegenRequest,
    BridgeCodegenResponse,
    BridgePatchExportRequest,
    BridgePatchExportResponse,
    BridgePreviewOperationsRequest,
} from '../../../bridge/protocol';
import type {
    EditorOperation,
    EditorOperationResult,
    EditorSessionState,
    EditorSessionSummary,
    OfflinePatchValidation,
} from '../../../core';
import {
    generateCodeFromOfflinePatch,
    validateOfflinePatchText,
} from '../../../core';
import type { Logger } from './logger';
import { SessionRegistry } from './sessionRegistry';

interface McpTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

interface McpToolResult {
    content: Array<{ type: 'text'; text: string }>;
    structuredContent?: unknown;
    isError?: boolean;
}

interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

interface McpResourceTemplate {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType?: string;
}

interface McpResourceReadResult {
    contents: Array<{
        uri: string;
        mimeType: string;
        text: string;
    }>;
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
}

function asOptionalString(args: Record<string, unknown>, key: string): string | undefined {
    const value = args[key];
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`"${key}" must be a non-empty string.`);
    }
    return value.trim();
}

function asOptionalBoolean(args: Record<string, unknown>, key: string): boolean | undefined {
    const value = args[key];
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'boolean') {
        throw new Error(`"${key}" must be a boolean.`);
    }
    return value;
}

function asOperations(args: Record<string, unknown>): EditorOperation[] {
    const value = args.operations;
    if (!Array.isArray(value)) {
        throw new Error('"operations" must be an array.');
    }
    return value as EditorOperation[];
}

function jsonText(value: unknown): string {
    return `${JSON.stringify(value, null, 2)}\n`;
}

function toolSuccess(text: string, structuredContent?: unknown): McpToolResult {
    return {
        content: [{ type: 'text', text }],
        structuredContent,
    };
}

function toolFailure(message: string, structuredContent?: unknown): McpToolResult {
    return {
        content: [{ type: 'text', text: message }],
        structuredContent,
        isError: true,
    };
}

function graphSummary(graph: EditorSessionState['graphs'][number]) {
    return {
        id: graph.id,
        name: graph.name,
        order: graph.order,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        updatedAt: graph.updatedAt,
    };
}

function resolveGraph(
    state: EditorSessionState,
    graphId?: string | null,
) {
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

function guessMimeType(filePath: string): string {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.wav')) return 'audio/wav';
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.ogg')) return 'audio/ogg';
    if (lower.endsWith('.flac')) return 'audio/flac';
    if (lower.endsWith('.aiff') || lower.endsWith('.aif')) return 'audio/aiff';
    return 'application/octet-stream';
}

function assertPatchFilePath(filePath: string, label: string): string {
    const resolved = resolvePath(process.cwd(), filePath);
    if (!resolved.endsWith('.json') && !resolved.endsWith('.patch.json')) {
        throw new Error(`"${label}" must point to a JSON patch file.`);
    }
    return resolved;
}

function offlinePatchUri(filePath: string): string {
    return `din-studio://offline/patch/${encodeURIComponent(filePath)}`;
}

function decodeOfflinePatchUri(uri: string): string {
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

async function readPatchValidation(args: Record<string, unknown>): Promise<{ path?: string; validation: OfflinePatchValidation }> {
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

const TOOL_DEFINITIONS: McpTool[] = [
    {
        name: 'editor_list_sessions',
        description: 'List every live DIN Studio session currently connected to the local bridge.',
        inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
        },
    },
    {
        name: 'editor_get_state',
        description: 'Read the latest full state snapshot for a live DIN Studio session.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'editor_list_graphs',
        description: 'List graphs available in a live DIN Studio session.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'editor_get_graph',
        description: 'Read one graph from a live DIN Studio session. Defaults to the active graph.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
                graphId: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'editor_preview_operations',
        description: 'Preview a batch of DIN Studio operations against a live session without mutating it.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
                operations: {
                    type: 'array',
                    items: { type: 'object' },
                },
            },
            required: ['operations'],
            additionalProperties: false,
        },
    },
    {
        name: 'editor_apply_operations',
        description: 'Apply a batch of DIN Studio operations to a live session.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
                operations: {
                    type: 'array',
                    items: { type: 'object' },
                },
            },
            required: ['operations'],
            additionalProperties: false,
        },
    },
    {
        name: 'editor_import_patch',
        description: 'Import a patch JSON document into the active or specified live DIN Studio graph.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
                graphId: { type: 'string' },
                path: { type: 'string' },
                text: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'editor_export_patch',
        description: 'Export a live graph to patch JSON or normalize an offline patch file.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
                graphId: { type: 'string' },
                path: { type: 'string' },
                outputPath: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'editor_validate_patch',
        description: 'Validate and normalize a patch JSON document from text or a local file path.',
        inputSchema: {
            type: 'object',
            properties: {
                path: { type: 'string' },
                text: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'editor_generate_code',
        description: 'Generate React code from a live graph or an offline patch JSON document.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
                graphId: { type: 'string' },
                path: { type: 'string' },
                text: { type: 'string' },
                includeProvider: { type: 'boolean' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'editor_list_assets',
        description: 'List audio assets stored inside a live DIN Studio session.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'editor_ingest_asset_file',
        description: 'Read a local audio file and ingest it into a live DIN Studio asset library.',
        inputSchema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string' },
                path: { type: 'string' },
                fileName: { type: 'string' },
                mimeType: { type: 'string' },
            },
            required: ['path'],
            additionalProperties: false,
        },
    },
];

const RESOURCE_TEMPLATES: McpResourceTemplate[] = [
    {
        uriTemplate: 'din-studio://session/{sessionId}/state',
        name: 'DIN Studio Session State',
        description: 'Read the latest live state snapshot for one DIN Studio session.',
        mimeType: 'application/json',
    },
    {
        uriTemplate: 'din-studio://session/{sessionId}/graphs',
        name: 'DIN Studio Graph List',
        description: 'Read the graph inventory for one DIN Studio session.',
        mimeType: 'application/json',
    },
    {
        uriTemplate: 'din-studio://session/{sessionId}/graphs/{graphId}',
        name: 'DIN Studio Graph',
        description: 'Read one graph from a DIN Studio session.',
        mimeType: 'application/json',
    },
    {
        uriTemplate: 'din-studio://offline/patch/{encodedPath}',
        name: 'DIN Studio Offline Patch',
        description: 'Read and normalize a local patch JSON file. Encode the filesystem path component.',
        mimeType: 'application/json',
    },
];

export class DinEditorMcpRuntime {
    constructor(
        private readonly registry: SessionRegistry,
        private readonly options: {
            readOnly: boolean;
            serverVersion: string;
            logger: Logger;
        },
    ) {}

    initialize(protocolVersion: string | undefined) {
        return {
            protocolVersion: protocolVersion ?? '2024-11-05',
            capabilities: {
                tools: {
                    listChanged: false,
                },
                resources: {
                    subscribe: false,
                    listChanged: false,
                },
            },
            serverInfo: {
                name: '@din/studio-mcp',
                version: this.options.serverVersion,
            },
        };
    }

    listTools(): { tools: McpTool[] } {
        return { tools: TOOL_DEFINITIONS };
    }

    listResources(): { resources: McpResource[] } {
        const sessions = this.registry.listSessionSummaries();
        const resources: McpResource[] = [
            {
                uri: 'din-studio://sessions',
                name: 'DIN Studio Sessions',
                description: 'Live DIN Studio session inventory.',
                mimeType: 'application/json',
            },
        ];

        sessions.forEach((session) => {
            resources.push(
                {
                    uri: `din-studio://session/${session.sessionId}/state`,
                    name: `DIN Studio Session ${session.sessionId} State`,
                    mimeType: 'application/json',
                },
                {
                    uri: `din-studio://session/${session.sessionId}/graphs`,
                    name: `DIN Studio Session ${session.sessionId} Graphs`,
                    mimeType: 'application/json',
                },
            );

            const state = this.registry.getSessionState(session.sessionId);
            state?.graphs.forEach((graph) => {
                resources.push({
                    uri: `din-studio://session/${session.sessionId}/graphs/${graph.id}`,
                    name: graph.name,
                    mimeType: 'application/json',
                });
            });
        });

        return { resources };
    }

    listResourceTemplates(): { resourceTemplates: McpResourceTemplate[] } {
        return { resourceTemplates: RESOURCE_TEMPLATES };
    }

    async readResource(uri: string): Promise<McpResourceReadResult> {
        if (uri === 'din-studio://sessions') {
            const sessions = this.registry.listSessionSummaries();
            return {
                contents: [{
                    uri,
                    mimeType: 'application/json',
                    text: jsonText({ sessions }),
                }],
            };
        }

        const parsed = new URL(uri);
        if (parsed.hostname === 'session') {
            const [sessionId, section, graphId] = parsed.pathname.split('/').filter(Boolean);
            if (!sessionId || !section) {
                throw new Error(`Unsupported DIN Studio resource "${uri}".`);
            }

            const state = this.registry.getSessionState(sessionId);
            if (!state) {
                throw new Error(`DIN Studio session "${sessionId}" was not found.`);
            }

            if (section === 'state') {
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: jsonText(state),
                    }],
                };
            }

            if (section === 'graphs' && !graphId) {
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: jsonText({
                            activeGraphId: state.activeGraphId,
                            graphs: state.graphs.map(graphSummary),
                        }),
                    }],
                };
            }

            if (section === 'graphs' && graphId) {
                const graph = resolveGraph(state, graphId);
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: jsonText(graph),
                    }],
                };
            }
        }

        if (parsed.hostname === 'offline') {
            const patchPath = assertPatchFilePath(decodeOfflinePatchUri(uri), 'uri');
            const text = await readFile(patchPath, 'utf8');
            const validation = validateOfflinePatchText(text);
            return {
                contents: [{
                    uri,
                    mimeType: 'application/json',
                    text: validation.normalizedText,
                }],
            };
        }

        throw new Error(`Unsupported DIN Studio resource "${uri}".`);
    }

    async callTool(name: string, args: unknown): Promise<McpToolResult> {
        const input = asRecord(args);

        try {
            if (name === 'editor_list_sessions') {
                const sessions = this.registry.listSessionSummaries();
                return toolSuccess(
                    `Found ${sessions.length} DIN Studio session(s).`,
                    { sessions },
                );
            }

            if (name === 'editor_get_state') {
                const session = this.registry.resolveSession(asOptionalString(input, 'sessionId'));
                const state = this.registry.getSessionState(session.sessionId);
                return toolSuccess(
                    `Loaded state for DIN Studio session "${session.sessionId}".`,
                    { session: this.summaryFor(session.sessionId), state },
                );
            }

            if (name === 'editor_list_graphs') {
                const session = this.registry.resolveSession(asOptionalString(input, 'sessionId'));
                const state = this.mustGetState(session.sessionId);
                return toolSuccess(
                    `Loaded ${state.graphs.length} graph(s) from DIN Studio session "${session.sessionId}".`,
                    {
                        sessionId: session.sessionId,
                        activeGraphId: state.activeGraphId,
                        graphs: state.graphs.map(graphSummary),
                    },
                );
            }

            if (name === 'editor_get_graph') {
                const session = this.registry.resolveSession(asOptionalString(input, 'sessionId'));
                const state = this.mustGetState(session.sessionId);
                const graph = resolveGraph(state, asOptionalString(input, 'graphId'));
                return toolSuccess(
                    `Loaded graph "${graph.name}" from DIN Studio session "${session.sessionId}".`,
                    {
                        sessionId: session.sessionId,
                        graph,
                    },
                );
            }

            if (name === 'editor_preview_operations') {
                const session = this.registry.resolveSession(asOptionalString(input, 'sessionId'));
                const result = await this.registry.request<BridgePreviewOperationsRequest, EditorOperationResult>(
                    session.sessionId,
                    'graph.preview_operations',
                    { operations: asOperations(input) },
                );
                return result.ok
                    ? toolSuccess(`Preview completed for DIN Studio session "${session.sessionId}".`, result)
                    : toolFailure(`Preview reported ${result.issues.length} issue(s).`, result);
            }

            if (name === 'editor_apply_operations') {
                if (this.options.readOnly) {
                    return toolFailure('DIN Studio MCP server is running in read-only mode.');
                }

                const session = this.registry.resolveSession(asOptionalString(input, 'sessionId'));
                const result = await this.registry.request<BridgeApplyOperationsRequest, EditorOperationResult>(
                    session.sessionId,
                    'graph.apply_operations',
                    { operations: asOperations(input) },
                );

                if (result.ok) {
                    this.options.logger.mutation('editor_apply_operations', {
                        sessionId: session.sessionId,
                        summary: result.summary,
                    });
                }

                return result.ok
                    ? toolSuccess(`Applied operations to DIN Studio session "${session.sessionId}".`, result)
                    : toolFailure(`Apply failed with ${result.issues.length} issue(s).`, result);
            }

            if (name === 'editor_import_patch') {
                if (this.options.readOnly) {
                    return toolFailure('DIN Studio MCP server is running in read-only mode.');
                }

                const session = this.registry.resolveSession(asOptionalString(input, 'sessionId'));
                const graphId = asOptionalString(input, 'graphId');
                const { validation } = await readPatchValidation(input);
                const result = await this.registry.request<BridgeApplyOperationsRequest, EditorOperationResult>(
                    session.sessionId,
                    'graph.apply_operations',
                    {
                        operations: [{
                            type: 'import_patch_into_active_graph',
                            graphId,
                            patch: validation.patch,
                        } satisfies EditorOperation],
                    },
                );

                if (result.ok) {
                    this.options.logger.mutation('editor_import_patch', {
                        sessionId: session.sessionId,
                        graphId,
                        summary: result.summary,
                    });
                }

                return result.ok
                    ? toolSuccess(`Imported patch into DIN Studio session "${session.sessionId}".`, result)
                    : toolFailure(`Patch import failed with ${result.issues.length} issue(s).`, result);
            }

            if (name === 'editor_export_patch') {
                const inputPath = asOptionalString(input, 'path');
                const outputPath = asOptionalString(input, 'outputPath');
                const sessionId = asOptionalString(input, 'sessionId');
                const graphId = asOptionalString(input, 'graphId');

                if (inputPath && !sessionId && !graphId) {
                    const resolvedPath = assertPatchFilePath(inputPath, 'path');
                    const text = await readFile(resolvedPath, 'utf8');
                    const validation = validateOfflinePatchText(text);

                    if (outputPath) {
                        const resolvedOutputPath = assertPatchFilePath(outputPath, 'outputPath');
                        await writeFile(resolvedOutputPath, validation.normalizedText, 'utf8');
                    }

                    return toolSuccess(
                        `Normalized offline patch "${resolvedPath}".`,
                        {
                            path: resolvedPath,
                            outputPath: outputPath ? assertPatchFilePath(outputPath, 'outputPath') : undefined,
                            patch: validation.patch,
                            summary: validation.summary,
                            text: validation.normalizedText,
                        },
                    );
                }

                const session = this.registry.resolveSession(sessionId);
                const result = await this.registry.request<BridgePatchExportRequest, BridgePatchExportResponse>(
                    session.sessionId,
                    'patch.export',
                    { graphId },
                );

                let resolvedOutputPath: string | undefined;
                if (outputPath) {
                    resolvedOutputPath = assertPatchFilePath(outputPath, 'outputPath');
                    await writeFile(resolvedOutputPath, result.text, 'utf8');
                }

                return toolSuccess(
                    `Exported patch from DIN Studio session "${session.sessionId}".`,
                    {
                        sessionId: session.sessionId,
                        graphId: graphId ?? null,
                        outputPath: resolvedOutputPath,
                        patch: result.patch,
                        text: result.text,
                    },
                );
            }

            if (name === 'editor_validate_patch') {
                const { path, validation } = await readPatchValidation(input);
                return toolSuccess(
                    path
                        ? `Validated offline patch "${path}".`
                        : 'Validated patch text.',
                    {
                        path,
                        patch: validation.patch,
                        summary: validation.summary,
                        text: validation.normalizedText,
                    },
                );
            }

            if (name === 'editor_generate_code') {
                const includeProvider = asOptionalBoolean(input, 'includeProvider') ?? false;
                const inputPath = asOptionalString(input, 'path');
                const inputText = asOptionalString(input, 'text');
                const sessionId = asOptionalString(input, 'sessionId');
                const graphId = asOptionalString(input, 'graphId');

                if ((inputPath || inputText) && (sessionId || graphId)) {
                    return toolFailure('Use either live session arguments or offline patch arguments, not both.');
                }

                if (inputPath || inputText) {
                    const { path, validation } = await readPatchValidation(input);
                    const code = generateCodeFromOfflinePatch(validation.patch, validation.patch.name, includeProvider);
                    return toolSuccess(
                        path
                            ? `Generated code from offline patch "${path}".`
                            : 'Generated code from patch text.',
                        {
                            path,
                            includeProvider,
                            summary: validation.summary,
                            code,
                        },
                    );
                }

                const session = this.registry.resolveSession(sessionId);
                const result = await this.registry.request<BridgeCodegenRequest, BridgeCodegenResponse>(
                    session.sessionId,
                    'codegen.generate',
                    {
                        graphId,
                        includeProvider,
                    },
                );
                return toolSuccess(
                    `Generated code from DIN Studio session "${session.sessionId}".`,
                    {
                        sessionId: session.sessionId,
                        graphId: graphId ?? null,
                        includeProvider,
                        graphName: result.graphName,
                        code: result.code,
                    },
                );
            }

            if (name === 'editor_list_assets') {
                const session = this.registry.resolveSession(asOptionalString(input, 'sessionId'));
                const assets = await this.registry.request<undefined, unknown[]>(
                    session.sessionId,
                    'assets.list',
                    undefined,
                );
                return toolSuccess(
                    `Loaded assets from DIN Studio session "${session.sessionId}".`,
                    {
                        sessionId: session.sessionId,
                        assets,
                    },
                );
            }

            if (name === 'editor_ingest_asset_file') {
                if (this.options.readOnly) {
                    return toolFailure('DIN Studio MCP server is running in read-only mode.');
                }

                const session = this.registry.resolveSession(asOptionalString(input, 'sessionId'));
                const localPath = resolvePath(process.cwd(), asOptionalString(input, 'path')!);
                const buffer = await readFile(localPath);
                const payload: BridgeAssetIngestRequest = {
                    fileName: asOptionalString(input, 'fileName') ?? basename(localPath),
                    mimeType: asOptionalString(input, 'mimeType') ?? guessMimeType(localPath),
                    bytesBase64: buffer.toString('base64'),
                };
                const asset = await this.registry.request<BridgeAssetIngestRequest, BridgeAssetIngestResponse>(
                    session.sessionId,
                    'assets.ingest_file',
                    payload,
                );

                this.options.logger.mutation('editor_ingest_asset_file', {
                    sessionId: session.sessionId,
                    path: localPath,
                    assetId: asset.assetId,
                });

                return toolSuccess(
                    `Ingested asset "${payload.fileName}" into DIN Studio session "${session.sessionId}".`,
                    {
                        sessionId: session.sessionId,
                        path: localPath,
                        asset,
                    },
                );
            }

            return toolFailure(`Unsupported tool "${name}".`);
        } catch (error) {
            return toolFailure(error instanceof Error ? error.message : 'Tool call failed.');
        }
    }

    private mustGetState(sessionId: string): EditorSessionState {
        const state = this.registry.getSessionState(sessionId);
        if (!state) {
            throw new Error(`DIN Studio session "${sessionId}" was not found.`);
        }
        return state;
    }

    private summaryFor(sessionId: string): EditorSessionSummary {
        const summary = this.registry.listSessionSummaries().find((entry) => entry.sessionId === sessionId);
        if (!summary) {
            throw new Error(`DIN Studio session "${sessionId}" was not found.`);
        }
        return summary;
    }
}

export {
    type McpResource,
    type McpResourceReadResult,
    type McpResourceTemplate,
    type McpTool,
    type McpToolResult,
    offlinePatchUri,
};
