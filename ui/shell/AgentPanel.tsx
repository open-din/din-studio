import { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, Settings } from 'lucide-react';
import { useAudioGraphStore } from '../editor/store';
import { runPatchAgent } from '../ai/agent';
import { applyOperations } from '../ai/applyOperations';
import { loadAgentChat, saveAgentChat } from '../ai/agentChatStorage';
import type { AgentMessage, GraphSnapshot } from '../ai/types';

function buildSnapshot(): GraphSnapshot {
    const state = useAudioGraphStore.getState();
    return {
        activeGraphId: state.activeGraphId,
        nodes: state.nodes.map((n) => ({
            id: n.id,
            type: n.data.type,
            label: (n.data as { label?: string }).label ?? n.data.type,
        })),
        edges: state.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
        })),
    };
}

function SetupView({ onSave }: { onSave: (key: string) => void }) {
    const [value, setValue] = useState('');

    const handleSave = () => {
        const trimmed = value.trim();
        if (trimmed) onSave(trimmed);
    };

    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
            <div className="w-full max-w-sm space-y-3">
                <p className="text-[12px] text-[var(--text-subtle)]">
                    Enter your OpenAI API key to enable AI patch generation.
                    Your key is stored locally and never sent anywhere except OpenAI.
                </p>
                <input
                    type="password"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                    placeholder="sk-..."
                    className="w-full border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-1.5 text-[12px] text-[var(--text)] placeholder-[var(--text-subtle)] outline-none focus:border-[var(--accent)]"
                />
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!value.trim()}
                    className="w-full bg-[var(--accent)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent-contrast,#fff)] disabled:opacity-40"
                >
                    Save Key
                </button>
            </div>
        </div>
    );
}

function MessageBubble({ msg }: { msg: AgentMessage }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap ${
                        isUser
                            ? 'bg-[var(--accent)] text-[var(--accent-contrast,#fff)]'
                            : 'bg-[var(--panel-muted)] text-[var(--text)]'
                    }`}
                >
                    {msg.content}
                </div>
                {msg.operationsApplied !== undefined && msg.operationsApplied > 0 && (
                    <div className="px-1 text-[10px] text-[var(--text-subtle)]">
                        ✓ {msg.operationsApplied} operation{msg.operationsApplied !== 1 ? 's' : ''} applied
                    </div>
                )}
                {msg.error && (
                    <div className="px-1 text-[10px] text-red-400">{msg.error}</div>
                )}
            </div>
        </div>
    );
}

export function AgentPanel() {
    const openAiApiKey = useAudioGraphStore((s) => s.openAiApiKey);
    const setOpenAiApiKey = useAudioGraphStore((s) => s.setOpenAiApiKey);
    const activeGraphId = useAudioGraphStore((s) => s.activeGraphId);

    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    /** Avoid persisting stale messages to the newly selected graph before state hydrates from storage. */
    const skipNextPersistRef = useRef(false);

    useEffect(() => {
        skipNextPersistRef.current = true;
        if (!activeGraphId) {
            setMessages([]);
            return;
        }
        setMessages(loadAgentChat(activeGraphId));
    }, [activeGraphId]);

    useEffect(() => {
        if (!activeGraphId) return;
        if (skipNextPersistRef.current) {
            skipNextPersistRef.current = false;
            return;
        }
        saveAgentChat(activeGraphId, messages);
    }, [activeGraphId, messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = useCallback(async () => {
        const prompt = input.trim();
        if (!prompt || isLoading || !openAiApiKey) return;

        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
        setIsLoading(true);

        try {
            const snapshot = buildSnapshot();
            const result = await runPatchAgent(prompt, snapshot, openAiApiKey);

            let operationsApplied = 0;
            let error: string | undefined;

            if (result.operations.length > 0) {
                try {
                    const applyResult = applyOperations(result.operations);
                    operationsApplied = applyResult.applied;
                } catch (err) {
                    error = err instanceof Error ? err.message : 'Failed to apply operations.';
                }
            }

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: result.text, operationsApplied, error },
            ]);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'An error occurred.', error: errorMsg },
            ]);
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    }, [input, isLoading, openAiApiKey]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
        }
    };

    if (!openAiApiKey) {
        return <SetupView onSave={(key) => setOpenAiApiKey(key)} />;
    }

    return (
        <div className="flex h-full flex-col gap-2">
            {/* Header */}
            <div className="flex flex-none items-center justify-between gap-2">
                <div className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-subtle)]">
                        AI Agent
                    </span>
                    <p className="text-[10px] text-[var(--text-subtle)] opacity-80">
                        Chat is saved per graph (this patch).
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        title="Clear chat for this graph"
                        onClick={() => setMessages([])}
                        className="p-1 text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
                    >
                        <Trash2 size={13} />
                    </button>
                    <button
                        type="button"
                        title="Change API key"
                        onClick={() => setOpenAiApiKey(null)}
                        className="p-1 text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
                    >
                        <Settings size={13} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-2 overflow-y-auto"
            >
                {messages.length === 0 && (
                    <p className="text-[11px] text-[var(--text-subtle)]">
                        Describe a patch to create or an edit to make. For example: "create a simple synth with reverb" or "add a filter before the output".
                    </p>
                )}
                {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} />
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[var(--panel-muted)] px-3 py-2 text-[12px] text-[var(--text-subtle)]">
                            Thinking…
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex flex-none items-end gap-2 border-t border-[var(--panel-border)] pt-2">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe a patch or edit…  (Enter to send, Shift+Enter for newline)"
                    rows={2}
                    className="min-h-0 flex-1 resize-none border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-1.5 text-[12px] text-[var(--text)] placeholder-[var(--text-subtle)] outline-none focus:border-[var(--accent)]"
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={isLoading || !input.trim()}
                    className="flex-none bg-[var(--accent)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent-contrast,#fff)] disabled:opacity-40 transition-opacity"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
