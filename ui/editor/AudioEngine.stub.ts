import { vi } from 'vitest';

export const audioEngine = {
    createNode: vi.fn(),
    updateNode: vi.fn(),
    removeNode: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    setPlaying: vi.fn(),
    setMasterGain: vi.fn(),
    loadGraph: vi.fn(),
    clear: vi.fn(),
    refreshConnections: vi.fn(),
    refreshDataValues: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    onSamplerEnd: vi.fn(() => () => {}),
    onAnalyzerUpdate: vi.fn(() => () => {}),
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    loadSamplerBuffer: vi.fn().mockResolvedValue(new AudioBuffer({ length: 1, sampleRate: 44100 })),
    playSampler: vi.fn(),
    stopSampler: vi.fn(),
    updateSamplerParam: vi.fn(),
    subscribeStep: vi.fn(() => () => {}),
    init: vi.fn().mockImplementation(() =>
        (typeof AudioContext !== 'undefined' ? new AudioContext() : ({} as AudioContext)),
    ),
    getContext: vi.fn(() => null),
    attachFaustDsp: vi.fn(),
    syncFaustParamsFromGraph: vi.fn(),
    setFaustMode: vi.fn(),
    prepareRecordingTap: vi.fn(),
    releaseRecordingTap: vi.fn(),
    beginMediaRecorder: vi.fn(),
    pauseRecordingCapture: vi.fn(),
    resumeRecordingCapture: vi.fn(),
    stopRecordingCapture: vi.fn().mockResolvedValue(new Blob()),
    getRecordingStereoTimeDomainData: vi.fn((left: Float32Array, right: Float32Array) => {
        left.fill(0);
        right.fill(0);
    }),
    getRecordingAnalyser: vi.fn(() => null),
    get playing() {
        return false;
    },
};

export default audioEngine;
