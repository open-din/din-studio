import { describe, expect, it } from 'vitest';
import { AUDIO_FILE_EXTENSION_RE, isLikelyAudioFile } from '../../ui/editor/audioImport';

describe('audioImport', () => {
    describe('isLikelyAudioFile', () => {
        it('accepts audio/* MIME types', () => {
            expect(isLikelyAudioFile(new File([], 'x.bin', { type: 'audio/wav' }))).toBe(true);
        });

        it('accepts common extensions when MIME is empty or octet-stream', () => {
            expect(isLikelyAudioFile(new File([], 'kit.WAV', { type: '' }))).toBe(true);
            expect(isLikelyAudioFile(new File([], 'track.flac', { type: 'application/octet-stream' }))).toBe(true);
        });

        it('rejects non-audio types without a known extension', () => {
            expect(isLikelyAudioFile(new File([], 'readme.txt', { type: 'text/plain' }))).toBe(false);
            expect(isLikelyAudioFile(new File([], 'data.bin', { type: '' }))).toBe(false);
        });
    });

    describe('AUDIO_FILE_EXTENSION_RE', () => {
        it('matches expected extensions', () => {
            expect(AUDIO_FILE_EXTENSION_RE.test('foo.wav')).toBe(true);
            expect(AUDIO_FILE_EXTENSION_RE.test('bar.MP3')).toBe(true);
            expect(AUDIO_FILE_EXTENSION_RE.test('noext')).toBe(false);
        });
    });
});
