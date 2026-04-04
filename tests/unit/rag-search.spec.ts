import { describe, expect, it, vi } from 'vitest';
import { cosineSimilarity, searchSimilar } from '../../src/rag/search';
import type { VectorRecord } from '../../src/rag/vectorStore';

describe('cosineSimilarity', () => {
    it('returns 1 for identical non-zero vectors', () => {
        const v = [1, 2, 3];
        expect(cosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it('returns 0 for orthogonal vectors', () => {
        expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    });

    it('returns -1 for opposite vectors', () => {
        expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
    });

    it('returns 0 for zero vector', () => {
        expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
        expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
    });

    it('returns 0 for mismatched dimensions', () => {
        expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });

    it('returns 0 for empty vectors', () => {
        expect(cosineSimilarity([], [])).toBe(0);
    });
});

describe('searchSimilar', () => {
    function makeRecord(id: string, embedding: number[], text = ''): VectorRecord {
        return {
            id,
            text: text || id,
            embedding,
            metadata: { filename: 'test.txt', contentHash: id },
        };
    }

    it('returns top-K records sorted by descending similarity', () => {
        const query = [1, 0, 0];
        const records = [
            makeRecord('a', [0, 1, 0]),   // orthogonal → score ≈ 0
            makeRecord('b', [1, 0, 0]),   // identical  → score = 1
            makeRecord('c', [0.5, 0.5, 0]), // partial  → score ≈ 0.71
        ];

        const results = searchSimilar(query, records, 2);
        expect(results).toHaveLength(2);
        expect(results[0]?.id).toBe('b');
        expect(results[1]?.id).toBe('c');
    });

    it('returns all records when topK >= records length', () => {
        const records = [makeRecord('x', [1, 0]), makeRecord('y', [0, 1])];
        expect(searchSimilar([1, 0], records, 10)).toHaveLength(2);
    });

    it('returns empty array for empty record set', () => {
        expect(searchSimilar([1, 0], [], 5)).toEqual([]);
    });

    it('includes text and metadata in results', () => {
        const record = makeRecord('m', [1, 0], 'my text');
        const results = searchSimilar([1, 0], [record], 1);
        expect(results[0]?.text).toBe('my text');
        expect(results[0]?.metadata?.filename).toBe('test.txt');
    });

    it('defaults topK to 5', () => {
        const records = Array.from({ length: 8 }, (_, i) =>
            makeRecord(`r${i}`, [i / 8, 1 - i / 8]),
        );
        const results = searchSimilar([1, 0], records);
        expect(results).toHaveLength(5);
    });
});
