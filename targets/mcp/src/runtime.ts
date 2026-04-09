import type { EditorSessionState, EditorSessionSummary } from '../../../core';
import type { Logger } from './logger';
import { SessionRegistry } from './sessionRegistry';
import { RESOURCE_TEMPLATES, TOOL_DEFINITIONS } from './runtime/definitions';
import { createToolHandlers } from './runtime/handlers';
import { listResources, readResource } from './runtime/resources';
import type {
    McpResource,
    McpResourceReadResult,
    McpResourceTemplate,
    McpTool,
    McpToolResult,
} from './runtime/types';
import { asRecord, offlinePatchUri, toolFailure } from './runtime/utils';

export class DinEditorMcpRuntime {
    private readonly toolHandlers: ReturnType<typeof createToolHandlers>;

    constructor(
        private readonly registry: SessionRegistry,
        private readonly options: {
            readOnly: boolean;
            serverVersion: string;
            logger: Logger;
        },
    ) {
        this.toolHandlers = createToolHandlers({
            registry: this.registry,
            options: this.options,
            mustGetState: this.mustGetState.bind(this),
            summaryFor: this.summaryFor.bind(this),
        });
    }

    initialize(protocolVersion: string | undefined) {
        return {
            protocolVersion: protocolVersion ?? '2024-11-05',
            capabilities: {
                tools: { listChanged: false },
                resources: { subscribe: false, listChanged: false },
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
        return listResources(this.registry);
    }

    listResourceTemplates(): { resourceTemplates: McpResourceTemplate[] } {
        return { resourceTemplates: RESOURCE_TEMPLATES };
    }

    async readResource(uri: string): Promise<McpResourceReadResult> {
        return readResource(this.registry, uri);
    }

    async callTool(name: string, args: unknown): Promise<McpToolResult> {
        const input = asRecord(args);
        const handler = this.toolHandlers[name];
        if (!handler) {
            return toolFailure(`Unsupported tool "${name}".`);
        }
        try {
            return await handler(input);
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
