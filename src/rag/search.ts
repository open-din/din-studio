import type { ChunkMetadata, VectorRecord } from './vectorStore';

export interface ScoredChunk {
    score: number;
    text: string;
    metadata?: ChunkMetadata;
    id?: string;
}

export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
}

export function searchSimilar(
    queryEmbedding: number[],
    records: VectorRecord[],
    topK = 5,
): ScoredChunk[] {
    const scored: ScoredChunk[] = records.map((r) => ({
        score: cosineSimilarity(queryEmbedding, r.embedding),
        text: r.text,
        metadata: r.metadata,
        id: r.id,
    }));
    scored.sort((x, y) => y.score - x.score);
    return scored.slice(0, topK);
}

export function debounce<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult | Promise<TResult>,
    waitMs: number,
): (...args: TArgs) => Promise<TResult> {
    let t: ReturnType<typeof setTimeout> | undefined;
    return (...args: TArgs) =>
        new Promise<TResult>((resolve, reject) => {
            clearTimeout(t);
            t = setTimeout(async () => {
                try {
                    resolve(await fn(...args));
                } catch (e) {
                    reject(e);
                }
            }, waitMs);
        });
}
