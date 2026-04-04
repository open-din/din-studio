import type { AgentMessage } from './types';

const STORAGE_KEY_PREFIX = 'din-studio-agent-chat-v1:';

function storageKey(graphId: string): string {
    return `${STORAGE_KEY_PREFIX}${graphId}`;
}

function parseMessages(raw: unknown): AgentMessage[] {
    if (!Array.isArray(raw)) return [];
    const out: AgentMessage[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const role = (item as { role?: unknown }).role;
        const content = (item as { content?: unknown }).content;
        if (role !== 'user' && role !== 'assistant') continue;
        if (typeof content !== 'string') continue;
        const msg: AgentMessage = { role, content };
        const operationsApplied = (item as { operationsApplied?: unknown }).operationsApplied;
        if (typeof operationsApplied === 'number') msg.operationsApplied = operationsApplied;
        const error = (item as { error?: unknown }).error;
        if (typeof error === 'string') msg.error = error;
        out.push(msg);
    }
    return out;
}

export function loadAgentChat(graphId: string): AgentMessage[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(storageKey(graphId));
        if (!raw) return [];
        return parseMessages(JSON.parse(raw) as unknown);
    } catch {
        return [];
    }
}

export function saveAgentChat(graphId: string, messages: AgentMessage[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(storageKey(graphId), JSON.stringify(messages));
    } catch {
        // Quota or private mode — ignore
    }
}

export function clearAgentChat(graphId: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.removeItem(storageKey(graphId));
    } catch {
        /* ignore */
    }
}
