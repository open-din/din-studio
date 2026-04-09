import { readFile } from 'node:fs/promises';
import type { SessionRegistry } from '../sessionRegistry';
import type { McpResource, McpResourceReadResult } from './types';
import { assertPatchFilePath, decodeOfflinePatchUri, graphSummary, jsonText, resolveGraph } from './utils';
import { validateOfflinePatchText } from '../../../../core';

export function listResources(registry: SessionRegistry): { resources: McpResource[] } {
    const sessions = registry.listSessionSummaries();
    const resources: McpResource[] = [{
        uri: 'din-studio://sessions',
        name: 'DIN Studio Sessions',
        description: 'Live DIN Studio session inventory.',
        mimeType: 'application/json',
    }];

    sessions.forEach((session) => {
        resources.push(
            { uri: `din-studio://session/${session.sessionId}/state`, name: `DIN Studio Session ${session.sessionId} State`, mimeType: 'application/json' },
            { uri: `din-studio://session/${session.sessionId}/graphs`, name: `DIN Studio Session ${session.sessionId} Graphs`, mimeType: 'application/json' },
        );

        const state = registry.getSessionState(session.sessionId);
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

export async function readResource(registry: SessionRegistry, uri: string): Promise<McpResourceReadResult> {
    if (uri === 'din-studio://sessions') {
        const sessions = registry.listSessionSummaries();
        return {
            contents: [{ uri, mimeType: 'application/json', text: jsonText({ sessions }) }],
        };
    }

    const parsed = new URL(uri);
    if (parsed.hostname === 'session') {
        const [sessionId, section, graphId] = parsed.pathname.split('/').filter(Boolean);
        if (!sessionId || !section) {
            throw new Error(`Unsupported DIN Studio resource "${uri}".`);
        }

        const state = registry.getSessionState(sessionId);
        if (!state) {
            throw new Error(`DIN Studio session "${sessionId}" was not found.`);
        }

        if (section === 'state') {
            return { contents: [{ uri, mimeType: 'application/json', text: jsonText(state) }] };
        }

        if (section === 'graphs' && !graphId) {
            return {
                contents: [{
                    uri,
                    mimeType: 'application/json',
                    text: jsonText({ activeGraphId: state.activeGraphId, graphs: state.graphs.map(graphSummary) }),
                }],
            };
        }

        if (section === 'graphs' && graphId) {
            const graph = resolveGraph(state, graphId);
            return { contents: [{ uri, mimeType: 'application/json', text: jsonText(graph) }] };
        }
    }

    if (parsed.hostname === 'offline') {
        const patchPath = assertPatchFilePath(decodeOfflinePatchUri(uri), 'uri');
        const text = await readFile(patchPath, 'utf8');
        const validation = validateOfflinePatchText(text);
        return { contents: [{ uri, mimeType: 'application/json', text: validation.normalizedText }] };
    }

    throw new Error(`Unsupported DIN Studio resource "${uri}".`);
}
