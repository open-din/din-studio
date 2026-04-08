/**
 * Encode edited recording buffers for download / library import.
 */

export type ExportAudioFormat = 'wav' | 'mp3' | 'webm';

/**
 * Returns a shallow copy of the buffer window [cropStart, cropEnd) in seconds.
 * When crop covers the full buffer, returns the same buffer reference.
 */
export function getCroppedOrFullBuffer(
    buffer: AudioBuffer,
    cropStart: number | null,
    cropEnd: number | null,
): AudioBuffer {
    const startSec = cropStart ?? 0;
    const endSec = cropEnd ?? buffer.duration;
    if (startSec <= 0 && endSec >= buffer.duration) {
        return buffer;
    }
    const sr = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    const startFrame = Math.max(0, Math.min(buffer.length, Math.floor(startSec * sr)));
    const endFrame = Math.max(startFrame, Math.min(buffer.length, Math.floor(endSec * sr)));
    const length = endFrame - startFrame;
    const out = new AudioBuffer({
        length,
        sampleRate: sr,
        numberOfChannels: channels,
    });
    for (let c = 0; c < channels; c++) {
        const src = buffer.getChannelData(c);
        out.getChannelData(c).set(src.subarray(startFrame, endFrame));
    }
    return out;
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

/** 16-bit little-endian WAV */
export function encodeWavFromBuffer(
    buffer: AudioBuffer,
    cropStart?: number | null,
    cropEnd?: number | null,
): Blob {
    const b = getCroppedOrFullBuffer(buffer, cropStart ?? null, cropEnd ?? null);
    const numChannels = b.numberOfChannels;
    const sampleRate = b.sampleRate;
    const numFrames = b.length;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numFrames * blockAlign;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
        for (let c = 0; c < numChannels; c++) {
            const sample = Math.max(-1, Math.min(1, b.getChannelData(c)[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        out[i] = s < 0 ? Math.floor(s * 0x8000) : Math.floor(s * 0x7fff);
    }
    return out;
}

/**
 * Concatenate MP3 chunks from lamejs.
 */
export async function encodeMp3FromBuffer(
    buffer: AudioBuffer,
    cropStart?: number | null,
    cropEnd?: number | null,
): Promise<Blob> {
    const b = getCroppedOrFullBuffer(buffer, cropStart ?? null, cropEnd ?? null);
    const lameMod = await import('lamejs');
    const { Mp3Encoder } = lameMod;
    const sampleRate = b.sampleRate;
    const channels = Math.min(2, b.numberOfChannels);
    const mp3encoder = new Mp3Encoder(channels, sampleRate, 128);
    const sampleBlockSize = 1152;
    const left = b.getChannelData(0);
    const right = channels > 1 ? b.getChannelData(1) : null;
    const mp3Data: BlobPart[] = [];

    for (let i = 0; i < left.length; i += sampleBlockSize) {
        const leftChunk = floatTo16BitPCM(left.subarray(i, Math.min(i + sampleBlockSize, left.length)));
        const encoded =
            channels === 2 && right
                ? mp3encoder.encodeBuffer(leftChunk, floatTo16BitPCM(right.subarray(i, Math.min(i + sampleBlockSize, right.length))))
                : mp3encoder.encodeBuffer(leftChunk);
        if (encoded.length > 0) {
            const u8 = new Uint8Array(encoded.byteLength);
            u8.set(encoded);
            mp3Data.push(u8);
        }
    }
    const end = mp3encoder.flush();
    if (end.length > 0) {
        const u8e = new Uint8Array(end.byteLength);
        u8e.set(end);
        mp3Data.push(u8e);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Best-effort WebM/Opus re-encode by playing the buffer into a MediaRecorder sink.
 * Falls back to WAV if MediaRecorder is unavailable.
 */
export async function encodeWebmFromBuffer(
    buffer: AudioBuffer,
    cropStart?: number | null,
    cropEnd?: number | null,
): Promise<Blob> {
    const b = getCroppedOrFullBuffer(buffer, cropStart ?? null, cropEnd ?? null);
    if (typeof MediaRecorder === 'undefined' || typeof AudioContext === 'undefined') {
        return encodeWavFromBuffer(b);
    }
    const mime =
        ['audio/webm;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
    if (!mime) {
        return encodeWavFromBuffer(b);
    }

    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = b;
    source.connect(dest);

    const recorder = new MediaRecorder(dest.stream, { mimeType: mime });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
    };

    try {
        const blob = await new Promise<Blob>((resolve, reject) => {
            recorder.onstop = () => {
                resolve(new Blob(chunks, { type: mime }));
            };
            recorder.onerror = () => reject(new Error('MediaRecorder error'));
            source.onended = () => {
                window.setTimeout(() => {
                    try {
                        recorder.stop();
                    } catch {
                        reject(new Error('MediaRecorder stop failed'));
                    }
                }, 200);
            };
            recorder.start(100);
            source.start(0);
        });
        await ctx.close().catch(() => {});
        return blob;
    } catch {
        await ctx.close().catch(() => {});
        return encodeWavFromBuffer(b);
    }
}
