import { retrieveContext } from './retrieve';

export interface ChatMessage {
    role: string;
    content: string;
}

function lastUserContent(messages: ChatMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role === 'user' && typeof m.content === 'string') {
            return m.content;
        }
    }
    return '';
}

export interface AugmentMessagesOptions {
    apiKey: string;
    topK?: number;
}

export async function augmentMessages(
    messages: ChatMessage[],
    options: AugmentMessagesOptions,
): Promise<ChatMessage[]> {
    const { apiKey, topK = 5 } = options;
    if (!apiKey) {
        throw new Error('augmentMessages: options.apiKey is required');
    }

    const userQuery = lastUserContent(messages);
    const context = await retrieveContext(userQuery, { apiKey, topK });

    const systemContent = [
        'Answer ONLY using the following information:',
        context,
        "If the information is not available, say 'I don't know'.",
    ].join('\n');

    return [{ role: 'system', content: systemContent }, ...messages];
}
