import { describe, expect, it } from 'vitest';
import {
    modelSupportsReasoningEffort,
    parseStoredReasoningMode,
    reasoningModeToApiEffort,
} from '../../ui/ai/agentSettings';

describe('modelSupportsReasoningEffort', () => {
    it('returns true for o-series models', () => {
        expect(modelSupportsReasoningEffort('o3-mini')).toBe(true);
        expect(modelSupportsReasoningEffort('o4-mini')).toBe(true);
        expect(modelSupportsReasoningEffort('o1')).toBe(true);
    });

    it('returns true for gpt-5 family', () => {
        expect(modelSupportsReasoningEffort('gpt-5')).toBe(true);
        expect(modelSupportsReasoningEffort('gpt-5-turbo')).toBe(true);
    });

    it('returns false for gpt-4o family', () => {
        expect(modelSupportsReasoningEffort('gpt-4o')).toBe(false);
        expect(modelSupportsReasoningEffort('gpt-4o-mini')).toBe(false);
        expect(modelSupportsReasoningEffort('gpt-4-turbo')).toBe(false);
    });

    it('returns false for unknown models', () => {
        expect(modelSupportsReasoningEffort('claude-3-opus')).toBe(false);
        expect(modelSupportsReasoningEffort('')).toBe(false);
    });
});

describe('reasoningModeToApiEffort', () => {
    it('maps default to undefined', () => {
        expect(reasoningModeToApiEffort('default')).toBeUndefined();
    });

    it('passes through low / medium / high verbatim', () => {
        expect(reasoningModeToApiEffort('low')).toBe('low');
        expect(reasoningModeToApiEffort('medium')).toBe('medium');
        expect(reasoningModeToApiEffort('high')).toBe('high');
    });
});

describe('parseStoredReasoningMode', () => {
    it('accepts valid stored values', () => {
        expect(parseStoredReasoningMode('low')).toBe('low');
        expect(parseStoredReasoningMode('medium')).toBe('medium');
        expect(parseStoredReasoningMode('high')).toBe('high');
    });

    it('falls back to default for null', () => {
        expect(parseStoredReasoningMode(null)).toBe('default');
    });

    it('falls back to default for unknown strings', () => {
        expect(parseStoredReasoningMode('ultra')).toBe('default');
        expect(parseStoredReasoningMode('')).toBe('default');
    });
});
