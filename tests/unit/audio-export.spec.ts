import { describe, expect, it } from 'vitest';
import { encodeWavFromBuffer, getCroppedOrFullBuffer } from '../../ui/editor/audioExport';

function sineBuffer(frames: number, sampleRate = 48000): AudioBuffer {
    const buffer = new AudioBuffer({ length: frames, numberOfChannels: 1, sampleRate });
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
        ch[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }
    return buffer;
}

describe('audioExport', () => {
    it('getCroppedOrFullBuffer returns same reference when crop spans full buffer', () => {
        const b = sineBuffer(1000);
        const full = getCroppedOrFullBuffer(b, 0, b.duration);
        expect(full).toBe(b);
    });

    it('getCroppedOrFullBuffer extracts a shorter window', () => {
        const b = sineBuffer(1000, 1000);
        const cropped = getCroppedOrFullBuffer(b, 0.2, 0.5);
        expect(cropped.length).toBe(300);
        expect(cropped.duration).toBeCloseTo(0.3, 5);
    });

    it('encodeWavFromBuffer writes RIFF WAVE header and PCM data', async () => {
        const b = sineBuffer(256, 8000);
        const blob = encodeWavFromBuffer(b, 0, b.duration);
        expect(blob.type).toBe('audio/wav');
        const ab = await blob.arrayBuffer();
        const view = new DataView(ab);
        expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe('RIFF');
        expect(String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))).toBe('WAVE');
        const dataSize = view.getUint32(40, true);
        expect(dataSize).toBe(b.length * 2);
        expect(ab.byteLength).toBe(44 + dataSize);
    });
});
