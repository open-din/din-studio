import { create } from 'zustand';
import type { MidiLearnCapture } from './midiLearnCapture';

export type MidiDetectionMode = 'off' | 'controllers' | 'keys' | 'all';

interface MidiDetectionState {
    mode: MidiDetectionMode;
    lastCapture: MidiLearnCapture | null;
    setMode: (mode: MidiDetectionMode) => void;
    setLastCapture: (capture: MidiLearnCapture | null) => void;
    clearCapture: () => void;
}

export const useMidiDetectionStore = create<MidiDetectionState>((set) => ({
    mode: 'off',
    lastCapture: null,
    setMode: (mode) => set({ mode, lastCapture: null }),
    setLastCapture: (lastCapture) => set({ lastCapture }),
    clearCapture: () => set({ lastCapture: null }),
}));
