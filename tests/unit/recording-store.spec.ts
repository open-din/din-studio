import { beforeEach, describe, expect, it, vi } from 'vitest';
import { audioEngine } from '../../ui/editor/AudioEngine';
import { useAudioGraphStore } from '../../ui/editor/store';
import { createInitialRecordingState } from '../../ui/editor/types';

describe('recording store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        audioEngine.releaseRecordingTap();
        useAudioGraphStore.setState({
            recording: createInitialRecordingState(),
            // Prevent initAudioContext from invoking jsdom's stub AudioContext constructor
            audioContext: {} as AudioContext,
        });
    });

    it('armRecording prepares tap and enters armed phase', () => {
        useAudioGraphStore.getState().armRecording();
        expect(audioEngine.prepareRecordingTap).toHaveBeenCalled();
        expect(useAudioGraphStore.getState().recording.phase).toBe('armed');
    });

    it('cancelOrStopRecording from armed releases tap and resets idle', async () => {
        useAudioGraphStore.getState().armRecording();
        await useAudioGraphStore.getState().cancelOrStopRecording();
        expect(audioEngine.releaseRecordingTap).toHaveBeenCalled();
        expect(useAudioGraphStore.getState().recording.phase).toBe('idle');
    });

    it('setPlaying true while armed starts engine and begins media recorder', () => {
        useAudioGraphStore.getState().armRecording();
        useAudioGraphStore.getState().setPlaying(true);
        expect(audioEngine.start).toHaveBeenCalled();
        expect(audioEngine.beginMediaRecorder).toHaveBeenCalled();
        expect(useAudioGraphStore.getState().recording.phase).toBe('recording');
    });

    it('setPlaying false while recording pauses capture and stops engine', () => {
        useAudioGraphStore.getState().armRecording();
        useAudioGraphStore.getState().setPlaying(true);
        vi.clearAllMocks();
        useAudioGraphStore.getState().setPlaying(false);
        expect(audioEngine.pauseRecordingCapture).toHaveBeenCalled();
        expect(audioEngine.stop).toHaveBeenCalled();
        expect(useAudioGraphStore.getState().recording.phase).toBe('paused');
    });
});
