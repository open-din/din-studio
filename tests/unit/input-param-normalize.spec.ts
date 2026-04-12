import { describe, expect, it } from 'vitest';
import { ensureInputParam } from '../../ui/editor/nodeHelpers';
import { normalizeUiTokenParams } from '../../ui/editor/uiTokens';

describe('ensureInputParam', () => {
    it('migrates legacy socketKind audio to type audio and sets audioSource', () => {
        const p = ensureInputParam({ socketKind: 'audio', id: 'a1', name: 'A', label: 'A' }, 'n1', 0);
        expect(p.type).toBe('audio');
        expect(p.socketKind).toBe('audio');
        expect(p.audioSource).toBe('none');
    });

    it('prefers socketKind audio over stored float type (legacy rows)', () => {
        const p = ensureInputParam(
            { type: 'float', socketKind: 'audio', id: 'a2', name: 'In' },
            'n1',
            0,
        );
        expect(p.type).toBe('audio');
    });

    it('maps trigger socket to float type unless type is set — legacy uses socketKind trigger', () => {
        const p = ensureInputParam({ socketKind: 'trigger', id: 't1', name: 'T' }, 'n1', 0);
        expect(p.type).toBe('trigger');
        expect(p.socketKind).toBe('trigger');
    });

    it('sets int step and control socket for numeric kinds', () => {
        const p = ensureInputParam({ type: 'int', id: 'i1', name: 'I' }, 'n1', 0);
        expect(p.type).toBe('int');
        expect(p.step).toBe(1);
        expect(p.socketKind).toBe('control');
    });

    it('persists explicit event kind', () => {
        const p = ensureInputParam({ type: 'event', id: 'e1', name: 'E' }, 'n1', 0);
        expect(p.type).toBe('event');
        expect(p.socketKind).toBe('trigger');
    });
});

describe('normalizeUiTokenParams', () => {
    it('coerces non-numeric kinds to float', () => {
        const out = normalizeUiTokenParams([
            { id: 'x', name: 'x', label: 'x', type: 'audio' } as import('../../ui/editor/types').InputParam,
        ]);
        expect(out[0]?.type).toBe('float');
        expect(out[0]?.socketKind).toBe('control');
    });
});
