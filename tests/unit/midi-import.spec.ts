import { describe, expect, it } from 'vitest';
import { MIDI_FILE_EXTENSION_RE, isLikelyMidiFile } from '../../ui/editor/audioImport';

describe('midi import helpers', () => {
    describe('isLikelyMidiFile', () => {
        it('accepts audio/midi MIME type', () => {
            expect(isLikelyMidiFile(new File([], 'song.mid', { type: 'audio/midi' }))).toBe(true);
        });

        it('accepts .mid, .midi, and .smf extensions when MIME is empty or octet-stream', () => {
            expect(isLikelyMidiFile(new File([], 'clip.MID', { type: '' }))).toBe(true);
            expect(isLikelyMidiFile(new File([], 'track.midi', { type: 'application/octet-stream' }))).toBe(true);
            expect(isLikelyMidiFile(new File([], 'standard.smf', { type: '' }))).toBe(true);
        });

        it('rejects non-MIDI types without a known extension', () => {
            expect(isLikelyMidiFile(new File([], 'readme.txt', { type: 'text/plain' }))).toBe(false);
            expect(isLikelyMidiFile(new File([], 'audio.wav', { type: 'audio/wav' }))).toBe(false);
        });
    });

    describe('MIDI_FILE_EXTENSION_RE', () => {
        it('matches expected extensions', () => {
            expect(MIDI_FILE_EXTENSION_RE.test('foo.mid')).toBe(true);
            expect(MIDI_FILE_EXTENSION_RE.test('bar.MIDI')).toBe(true);
            expect(MIDI_FILE_EXTENSION_RE.test('x.smf')).toBe(true);
            expect(MIDI_FILE_EXTENSION_RE.test('noext')).toBe(false);
        });
    });
});
