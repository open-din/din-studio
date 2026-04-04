const EMBED_MODEL = 'text-embedding-3-small';
const API_URL = 'https://api.openai.com/v1/embeddings';

interface EmbeddingsResponse {
    data?: Array<{ embedding?: number[] }>;
}

export async function createEmbedding(text: string, apiKey: string): Promise<number[]> {
    const body = JSON.stringify({
        model: EMBED_MODEL,
        input: text,
    });

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body,
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI embeddings failed: ${res.status} ${errText}`);
    }

    const data = (await res.json()) as EmbeddingsResponse;
    const vec = data.data?.[0]?.embedding;
    if (!Array.isArray(vec)) {
        throw new Error('OpenAI embeddings: missing embedding vector');
    }
    return vec;
}

export { EMBED_MODEL };
