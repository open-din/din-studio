import { describe, expect, it } from 'vitest';
import {
    chunkText,
    DEFAULT_CHUNK_CHARS,
    DEFAULT_OVERLAP_CHARS,
    parseFileToPlainText,
} from '../../src/rag/chunker';

describe('chunkText', () => {
    it('returns empty array for empty string', () => {
        expect(chunkText('')).toEqual([]);
        expect(chunkText('   \n  ')).toEqual([]);
    });

    it('returns single chunk when text fits within limit', () => {
        const text = 'hello world';
        const chunks = chunkText(text, 100, 20);
        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toBe('hello world');
    });

    it('splits text into overlapping chunks', () => {
        const text = 'a'.repeat(500);
        const chunks = chunkText(text, 200, 50);
        expect(chunks.length).toBeGreaterThan(1);
        // each chunk is at most chunkChars
        for (const chunk of chunks) {
            expect(chunk.length).toBeLessThanOrEqual(200);
        }
        // last chunk ends at the text boundary
        const lastChunk = chunks[chunks.length - 1] ?? '';
        expect(text.endsWith(lastChunk)).toBe(true);
    });

    it('covers the full text across chunks without holes', () => {
        const text = 'abcdefghij'.repeat(60); // 600 chars
        const chunks = chunkText(text, 100, 20);
        // First char of each chunk after the first should appear in the previous chunk (overlap)
        for (let i = 1; i < chunks.length; i++) {
            const prev = chunks[i - 1] ?? '';
            const curr = chunks[i] ?? '';
            expect(prev).toContain(curr.slice(0, 20));
        }
    });

    it('normalises CRLF to LF', () => {
        const chunks = chunkText('line1\r\nline2', 200, 50);
        expect(chunks[0]).toContain('line1\nline2');
    });

    it('uses defaults when called with no options', () => {
        const text = 'x'.repeat(DEFAULT_CHUNK_CHARS + 10);
        const chunks = chunkText(text);
        // Should produce more than one chunk with the default size
        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks[0]?.length).toBe(DEFAULT_CHUNK_CHARS);
        // second chunk starts at (DEFAULT_CHUNK_CHARS - DEFAULT_OVERLAP_CHARS)
        const overlapStart = DEFAULT_CHUNK_CHARS - DEFAULT_OVERLAP_CHARS;
        expect(chunks[1]?.startsWith(text.slice(overlapStart, overlapStart + 10))).toBe(true);
    });
});

describe('parseFileToPlainText', () => {
    it('returns raw text for non-JSON extensions', () => {
        const raw = 'just some text';
        expect(parseFileToPlainText(raw, '.txt')).toBe(raw);
        expect(parseFileToPlainText(raw, '.md')).toBe(raw);
    });

    it('pretty-prints valid JSON for .json files', () => {
        const obj = { key: 'value', num: 42 };
        const raw = JSON.stringify(obj);
        const result = parseFileToPlainText(raw, '.json');
        expect(result).toContain('"key": "value"');
        expect(result).toContain('"num": 42');
    });

    it('returns JSON string value directly', () => {
        const result = parseFileToPlainText('"hello"', '.json');
        expect(result).toBe('hello');
    });

    it('falls back to raw text on invalid JSON', () => {
        const raw = '{invalid json}';
        expect(parseFileToPlainText(raw, '.json')).toBe(raw);
    });
});
