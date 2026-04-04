/** ~500 tokens (~2000 chars) with ~100 token overlap (~400 chars). */
export const DEFAULT_CHUNK_CHARS = 2000;
export const DEFAULT_OVERLAP_CHARS = 400;

export function chunkText(
    text: string,
    chunkChars: number = DEFAULT_CHUNK_CHARS,
    overlapChars: number = DEFAULT_OVERLAP_CHARS,
): string[] {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];

    const chunks: string[] = [];
    let start = 0;
    while (start < normalized.length) {
        const end = Math.min(start + chunkChars, normalized.length);
        chunks.push(normalized.slice(start, end));
        if (end >= normalized.length) break;
        const next = end - overlapChars;
        start = next > start ? next : end;
    }
    return chunks;
}

export function parseFileToPlainText(raw: string, ext: string): string {
    if (ext === '.json') {
        try {
            const parsed: unknown = JSON.parse(raw);
            if (typeof parsed === 'string') return parsed;
            return JSON.stringify(parsed, null, 2);
        } catch {
            return raw;
        }
    }
    return raw;
}
