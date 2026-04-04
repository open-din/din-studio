import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearAgentChat, loadAgentChat, saveAgentChat } from '../../ui/ai/agentChatStorage';

const GRAPH_A = 'graph-alpha';
const GRAPH_B = 'graph-beta';

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    localStorage.clear();
});

describe('saveAgentChat / loadAgentChat', () => {
    it('round-trips user and assistant messages', () => {
        const messages = [
            { role: 'user' as const, content: 'add a reverb' },
            { role: 'assistant' as const, content: 'Done.', operationsApplied: 2 },
        ];
        saveAgentChat(GRAPH_A, messages);
        expect(loadAgentChat(GRAPH_A)).toEqual(messages);
    });

    it('returns empty array for unknown graph', () => {
        expect(loadAgentChat('nonexistent-graph')).toEqual([]);
    });

    it('keeps chat isolated per graph', () => {
        saveAgentChat(GRAPH_A, [{ role: 'user', content: 'alpha msg' }]);
        saveAgentChat(GRAPH_B, [{ role: 'user', content: 'beta msg' }]);

        expect(loadAgentChat(GRAPH_A)[0]?.content).toBe('alpha msg');
        expect(loadAgentChat(GRAPH_B)[0]?.content).toBe('beta msg');
    });

    it('overwrites previous messages on save', () => {
        saveAgentChat(GRAPH_A, [{ role: 'user', content: 'v1' }]);
        saveAgentChat(GRAPH_A, [{ role: 'user', content: 'v2' }]);
        const loaded = loadAgentChat(GRAPH_A);
        expect(loaded).toHaveLength(1);
        expect(loaded[0]?.content).toBe('v2');
    });

    it('preserves optional error field', () => {
        saveAgentChat(GRAPH_A, [
            { role: 'assistant', content: 'oops', error: 'timeout' },
        ]);
        const loaded = loadAgentChat(GRAPH_A);
        expect(loaded[0]?.error).toBe('timeout');
    });

    it('silently drops malformed entries on load', () => {
        localStorage.setItem('din-studio-agent-chat-v1:graph-bad', JSON.stringify([
            { role: 'bot', content: 'invalid role' },
            { role: 'user', content: 42 },
            { role: 'user', content: 'valid' },
        ]));
        const loaded = loadAgentChat('graph-bad');
        expect(loaded).toHaveLength(1);
        expect(loaded[0]?.content).toBe('valid');
    });

    it('returns empty array when storage contains invalid JSON', () => {
        localStorage.setItem('din-studio-agent-chat-v1:graph-corrupt', 'not-json');
        expect(loadAgentChat('graph-corrupt')).toEqual([]);
    });
});

describe('clearAgentChat', () => {
    it('removes messages for the target graph only', () => {
        saveAgentChat(GRAPH_A, [{ role: 'user', content: 'alpha' }]);
        saveAgentChat(GRAPH_B, [{ role: 'user', content: 'beta' }]);
        clearAgentChat(GRAPH_A);

        expect(loadAgentChat(GRAPH_A)).toEqual([]);
        expect(loadAgentChat(GRAPH_B)).toHaveLength(1);
    });

    it('is a no-op for an unknown graph', () => {
        expect(() => clearAgentChat('nonexistent')).not.toThrow();
    });
});
