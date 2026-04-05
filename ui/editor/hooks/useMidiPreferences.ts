import type { MidiRuntime } from '@open-din/react/midi';

export const MIDI_DEFAULT_INPUT_STORAGE_KEY = 'din-studio-midi-default-input';
export const MIDI_DEFAULT_OUTPUT_STORAGE_KEY = 'din-studio-midi-default-output';

/** Apply persisted default port IDs to the shared editor MIDI runtime (call once on app mount). */
export function applyStoredMidiDefaults(runtime: MidiRuntime): void {
    if (typeof window === 'undefined') return;
    const inputId = window.localStorage.getItem(MIDI_DEFAULT_INPUT_STORAGE_KEY);
    const outputId = window.localStorage.getItem(MIDI_DEFAULT_OUTPUT_STORAGE_KEY);
    if (inputId) {
        runtime.setDefaultInputId(inputId);
    }
    if (outputId) {
        runtime.setDefaultOutputId(outputId);
    }
}

export function persistDefaultMidiInput(id: string | null): void {
    if (typeof window === 'undefined') return;
    if (id == null || id === '') {
        window.localStorage.removeItem(MIDI_DEFAULT_INPUT_STORAGE_KEY);
    } else {
        window.localStorage.setItem(MIDI_DEFAULT_INPUT_STORAGE_KEY, id);
    }
}

export function persistDefaultMidiOutput(id: string | null): void {
    if (typeof window === 'undefined') return;
    if (id == null || id === '') {
        window.localStorage.removeItem(MIDI_DEFAULT_OUTPUT_STORAGE_KEY);
    } else {
        window.localStorage.setItem(MIDI_DEFAULT_OUTPUT_STORAGE_KEY, id);
    }
}
