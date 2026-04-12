import { basename, resolve as resolvePath } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import type {
    BridgeApplyOperationsRequest,
    BridgeAssetIngestRequest,
    BridgeAssetIngestResponse,
    BridgeCodegenRequest,
    BridgeCodegenResponse,
    BridgeExportFileRequest,
    BridgeExportFileResponse,
    BridgeFocusWindowResponse,
    BridgeOpenProjectRequest,
    BridgeOpenProjectResponse,
    BridgePatchExportRequest,
    BridgePatchExportResponse,
    BridgePreviewOperationsRequest,
} from '../../../../bridge/protocol';
import type { EditorOperation, EditorOperationResult, EditorSessionState, EditorSessionSummary } from '../../../../core';
import { generateCodeFromOfflinePatch, generateFaustBundleFromOfflinePatch } from '../../../../core';
import type { Logger } from '../logger';
import type { SessionRegistry } from '../sessionRegistry';
import type { McpToolResult } from './types';
import {
    asOperations,
    asOptionalBoolean,
    asOptionalString,
    assertPatchFilePath,
    guessMimeType,
    graphSummary,
    readPatchValidation,
    resolveGraph,
    toolFailure,
    toolSuccess,
} from './utils';

interface RuntimeOptions {
    readOnly: boolean;
    serverVersion: string;
    logger: Logger;
}

export interface RuntimeHandlerContext {
    registry: SessionRegistry;
    options: RuntimeOptions;
    mustGetState: (sessionId: string) => EditorSessionState;
    summaryFor: (sessionId: string) => EditorSessionSummary;
}

type ToolHandler = (input: Record<string, unknown>) => Promise<McpToolResult>;

function buildSessionHandlers(context: RuntimeHandlerContext): Record<string, ToolHandler> {
    return {
        async editor_list_sessions() {
            const sessions = context.registry.listSessionSummaries();
            return toolSuccess(`Found ${sessions.length} DIN Studio session(s).`, { sessions });
        },
        async editor_get_state(input) {
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const state = context.registry.getSessionState(session.sessionId);
            return toolSuccess(`Loaded state for DIN Studio session "${session.sessionId}".`, {
                session: context.summaryFor(session.sessionId),
                state,
            });
        },
        async editor_list_graphs(input) {
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const state = context.mustGetState(session.sessionId);
            return toolSuccess(`Loaded ${state.graphs.length} graph(s) from DIN Studio session "${session.sessionId}".`, {
                sessionId: session.sessionId,
                activeGraphId: state.activeGraphId,
                graphs: state.graphs.map(graphSummary),
            });
        },
        async editor_get_graph(input) {
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const state = context.mustGetState(session.sessionId);
            const graph = resolveGraph(state, asOptionalString(input, 'graphId'));
            return toolSuccess(`Loaded graph "${graph.name}" from DIN Studio session "${session.sessionId}".`, {
                sessionId: session.sessionId,
                graph,
            });
        },
        async editor_app_status() {
            const sessions = context.registry.listSessionSummaries();
            return toolSuccess(`DIN Studio MCP server is running with ${sessions.length} active session(s).`, {
                status: 'running',
                serverVersion: context.options.serverVersion,
                readOnly: context.options.readOnly,
                sessionCount: sessions.length,
                sessions: sessions.map((session) => ({
                    sessionId: session.sessionId,
                    appVersion: session.appVersion,
                    connectedAt: session.connectedAt,
                    lastSeenAt: session.lastSeenAt,
                    graphCount: session.graphCount,
                })),
                uptime: Math.floor(process.uptime()),
            });
        },
    };
}

function buildGraphHandlers(context: RuntimeHandlerContext): Record<string, ToolHandler> {
    return {
        async editor_preview_operations(input) {
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const result = await context.registry.request<BridgePreviewOperationsRequest, EditorOperationResult>(
                session.sessionId,
                'graph.preview_operations',
                { operations: asOperations(input) },
            );
            return result.ok
                ? toolSuccess(`Preview completed for DIN Studio session "${session.sessionId}".`, result)
                : toolFailure(`Preview reported ${result.issues.length} issue(s).`, result);
        },
        async editor_apply_operations(input) {
            if (context.options.readOnly) {
                return toolFailure('DIN Studio MCP server is running in read-only mode.');
            }
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const result = await context.registry.request<BridgeApplyOperationsRequest, EditorOperationResult>(
                session.sessionId,
                'graph.apply_operations',
                { operations: asOperations(input) },
            );
            if (result.ok) {
                context.options.logger.mutation('editor_apply_operations', { sessionId: session.sessionId, summary: result.summary });
            }
            return result.ok
                ? toolSuccess(`Applied operations to DIN Studio session "${session.sessionId}".`, result)
                : toolFailure(`Apply failed with ${result.issues.length} issue(s).`, result);
        },
        async editor_import_patch(input) {
            if (context.options.readOnly) {
                return toolFailure('DIN Studio MCP server is running in read-only mode.');
            }
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const graphId = asOptionalString(input, 'graphId');
            const { validation } = await readPatchValidation(input);
            const result = await context.registry.request<BridgeApplyOperationsRequest, EditorOperationResult>(
                session.sessionId,
                'graph.apply_operations',
                { operations: [{ type: 'import_patch_into_active_graph', graphId, patch: validation.patch } satisfies EditorOperation] },
            );
            if (result.ok) {
                context.options.logger.mutation('editor_import_patch', { sessionId: session.sessionId, graphId, summary: result.summary });
            }
            return result.ok
                ? toolSuccess(`Imported patch into DIN Studio session "${session.sessionId}".`, result)
                : toolFailure(`Patch import failed with ${result.issues.length} issue(s).`, result);
        },
    };
}

function buildOfflinePatchHandlers(context: RuntimeHandlerContext): Record<string, ToolHandler> {
    return {
        async editor_export_patch(input) {
            const inputPath = asOptionalString(input, 'path');
            const outputPath = asOptionalString(input, 'outputPath');
            const sessionId = asOptionalString(input, 'sessionId');
            const graphId = asOptionalString(input, 'graphId');

            if (inputPath && !sessionId && !graphId) {
                const resolvedPath = assertPatchFilePath(inputPath, 'path');
                const text = await readFile(resolvedPath, 'utf8');
                const { validateOfflinePatchText } = await import('../../../../core');
                const validation = validateOfflinePatchText(text);
                const resolvedOutputPath = outputPath ? assertPatchFilePath(outputPath, 'outputPath') : undefined;
                if (resolvedOutputPath) {
                    await writeFile(resolvedOutputPath, validation.normalizedText, 'utf8');
                }
                return toolSuccess(`Normalized offline patch "${resolvedPath}".`, {
                    path: resolvedPath,
                    outputPath: resolvedOutputPath,
                    patch: validation.patch,
                    summary: validation.summary,
                    text: validation.normalizedText,
                });
            }

            const session = context.registry.resolveSession(sessionId);
            const result = await context.registry.request<BridgePatchExportRequest, BridgePatchExportResponse>(
                session.sessionId,
                'patch.export',
                { graphId },
            );

            let resolvedOutputPath: string | undefined;
            if (outputPath) {
                resolvedOutputPath = assertPatchFilePath(outputPath, 'outputPath');
                await writeFile(resolvedOutputPath, result.text, 'utf8');
            }

            return toolSuccess(`Exported patch from DIN Studio session "${session.sessionId}".`, {
                sessionId: session.sessionId,
                graphId: graphId ?? null,
                outputPath: resolvedOutputPath,
                patch: result.patch,
                text: result.text,
            });
        },
        async editor_validate_patch(input) {
            const { path, validation } = await readPatchValidation(input);
            return toolSuccess(path ? `Validated offline patch "${path}".` : 'Validated patch text.', {
                path,
                patch: validation.patch,
                summary: validation.summary,
                text: validation.normalizedText,
            });
        },
        async editor_generate_code(input) {
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
                const faust = generateFaustBundleFromOfflinePatch(validation.patch, validation.patch.name);
                return toolSuccess(path ? `Generated code from offline patch "${path}".` : 'Generated code from patch text.', {
                    path,
                    includeProvider,
                    summary: validation.summary,
                    code,
                    faustDsp: faust.faust || undefined,
                    faustManifest: faust.manifest,
                    faustDiagnostics: faust.diagnostics,
                });
            }

            const session = context.registry.resolveSession(sessionId);
            const result = await context.registry.request<BridgeCodegenRequest, BridgeCodegenResponse>(
                session.sessionId,
                'codegen.generate',
                { graphId, includeProvider },
            );
            return toolSuccess(`Generated code from DIN Studio session "${session.sessionId}".`, {
                sessionId: session.sessionId,
                graphId: graphId ?? null,
                includeProvider,
                graphName: result.graphName,
                code: result.code,
                faustDsp: result.faustDsp,
                faustManifestJson: result.faustManifestJson,
            });
        },
    };
}

function buildAssetAndAppHandlers(context: RuntimeHandlerContext): Record<string, ToolHandler> {
    return {
        async editor_list_assets(input) {
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const assets = await context.registry.request<undefined, unknown[]>(session.sessionId, 'assets.list', undefined);
            return toolSuccess(`Loaded assets from DIN Studio session "${session.sessionId}".`, { sessionId: session.sessionId, assets });
        },
        async editor_ingest_asset_file(input) {
            if (context.options.readOnly) {
                return toolFailure('DIN Studio MCP server is running in read-only mode.');
            }
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const localPath = resolvePath(process.cwd(), asOptionalString(input, 'path')!);
            const buffer = await readFile(localPath);
            const payload: BridgeAssetIngestRequest = {
                fileName: asOptionalString(input, 'fileName') ?? basename(localPath),
                mimeType: asOptionalString(input, 'mimeType') ?? guessMimeType(localPath),
                bytesBase64: buffer.toString('base64'),
            };
            const asset = await context.registry.request<BridgeAssetIngestRequest, BridgeAssetIngestResponse>(
                session.sessionId,
                'assets.ingest_file',
                payload,
            );
            context.options.logger.mutation('editor_ingest_asset_file', { sessionId: session.sessionId, path: localPath, assetId: asset.assetId });
            return toolSuccess(`Ingested asset "${payload.fileName}" into DIN Studio session "${session.sessionId}".`, {
                sessionId: session.sessionId,
                path: localPath,
                asset,
            });
        },
        async editor_focus_window(input) {
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const result = await context.registry.request<undefined, BridgeFocusWindowResponse>(session.sessionId, 'app.focus_window', undefined);
            return toolSuccess(
                result.focused
                    ? `Focused DIN Studio window for session "${session.sessionId}".`
                    : `DIN Studio session "${session.sessionId}" could not focus the window.`,
                { sessionId: session.sessionId, ...result },
            );
        },
        async editor_open_project(input) {
            if (context.options.readOnly) {
                return toolFailure('DIN Studio MCP server is running in read-only mode.');
            }
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const path = asOptionalString(input, 'path');
            if (!path) {
                return toolFailure('"path" is required.');
            }
            const result = await context.registry.request<BridgeOpenProjectRequest, BridgeOpenProjectResponse>(
                session.sessionId,
                'app.open_project',
                { path },
            );
            context.options.logger.mutation('editor_open_project', { sessionId: session.sessionId, path, projectId: result.projectId });
            return toolSuccess(
                result.opened ? `Opened project "${result.projectName}" in DIN Studio.` : `Failed to open project at "${path}".`,
                { sessionId: session.sessionId, ...result },
            );
        },
        async editor_export_file(input) {
            const session = context.registry.resolveSession(asOptionalString(input, 'sessionId'));
            const outputPath = asOptionalString(input, 'outputPath');
            if (!outputPath) {
                return toolFailure('"outputPath" is required.');
            }
            const format = (asOptionalString(input, 'format') ?? 'patch.json') as 'patch.json' | 'react';
            const graphId = asOptionalString(input, 'graphId');
            const result = await context.registry.request<BridgeExportFileRequest, BridgeExportFileResponse>(
                session.sessionId,
                'app.export_file',
                { graphId, outputPath, format },
            );
            return toolSuccess(
                result.written ? `Exported ${format} file to "${result.outputPath}" (${result.size} bytes).` : `Export failed for "${outputPath}".`,
                { sessionId: session.sessionId, ...result },
            );
        },
    };
}

export function createToolHandlers(context: RuntimeHandlerContext): Record<string, ToolHandler> {
    return {
        ...buildSessionHandlers(context),
        ...buildGraphHandlers(context),
        ...buildOfflinePatchHandlers(context),
        ...buildAssetAndAppHandlers(context),
    };
}
