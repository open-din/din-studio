import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { EditorOperation } from '../../core/types';
import type { AgentMessage, GraphSnapshot } from './types';
import { buildSystemPrompt } from './systemPrompt';
import { PATCH_TOOLS } from './tools';

export interface AgentResult {
    text: string;
    operations: EditorOperation[];
}

export interface RunPatchAgentOptions {
    model: string;
    /** Passed to OpenAI as `reasoning_effort` for supported models (o·series, gpt-5·, …). */
    reasoningEffort?: 'low' | 'medium' | 'high';
}

/** Max user+assistant pairs kept to limit tokens (large system prompt + catalog). */
const MAX_THREAD_MESSAGES = 48;

function agentThreadToApiMessages(thread: AgentMessage[]): ChatCompletionMessageParam[] {
    return thread.map((m) => {
        if (m.role === 'user') {
            return { role: 'user', content: m.content };
        }
        let text = m.content.trim() || '(patch update)';
        if (m.operationsApplied !== undefined && m.operationsApplied > 0) {
            text += `\n\n[Graph: ${m.operationsApplied} editor operation(s) applied successfully.]`;
        }
        if (m.error) {
            text += `\n\n[Graph apply error: ${m.error}]`;
        }
        return { role: 'assistant', content: text };
    });
}

/**
 * @param conversation Full thread for this graph, **including** the latest user message as the last entry.
 *        The current graph layout is still passed in `snapshot` (refreshed server-side each call).
 */
export async function runPatchAgent(
    conversation: AgentMessage[],
    snapshot: GraphSnapshot,
    apiKey: string,
    options: RunPatchAgentOptions,
): Promise<AgentResult> {
    if (conversation.length === 0 || conversation[conversation.length - 1]?.role !== 'user') {
        throw new Error('runPatchAgent: conversation must end with a user message.');
    }

    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const trimmed = conversation.length > MAX_THREAD_MESSAGES
        ? conversation.slice(-MAX_THREAD_MESSAGES)
        : conversation;

    const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: buildSystemPrompt(snapshot) },
        ...agentThreadToApiMessages(trimmed),
    ];

    const response = await client.chat.completions.create({
        model: options.model,
        ...(options.reasoningEffort ? { reasoning_effort: options.reasoningEffort } : {}),
        tools: PATCH_TOOLS,
        tool_choice: 'auto',
        messages,
    });

    const message = response.choices[0]?.message;
    if (!message) {
        return { text: 'No response from model.', operations: [] };
    }

    let operations: EditorOperation[] = [];

    if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
            if (toolCall.function.name === 'apply_patch_operations') {
                try {
                    const args = JSON.parse(toolCall.function.arguments) as { operations: EditorOperation[] };
                    if (Array.isArray(args.operations)) {
                        operations = args.operations;
                    }
                } catch {
                    // Malformed JSON from model — skip
                }
            }
        }
    }

    const text = message.content ?? (operations.length > 0 ? 'Patch updated.' : 'Done.');
    return { text, operations };
}
