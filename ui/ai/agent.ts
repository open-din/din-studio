import OpenAI from 'openai';
import type { EditorOperation } from '../../core/types';
import type { GraphSnapshot } from './types';
import { buildSystemPrompt } from './systemPrompt';
import { PATCH_TOOLS } from './tools';

export interface AgentResult {
    text: string;
    operations: EditorOperation[];
}

export async function runPatchAgent(
    prompt: string,
    snapshot: GraphSnapshot,
    apiKey: string,
): Promise<AgentResult> {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        tools: PATCH_TOOLS,
        tool_choice: 'auto',
        messages: [
            { role: 'system', content: buildSystemPrompt(snapshot) },
            { role: 'user', content: prompt },
        ],
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
