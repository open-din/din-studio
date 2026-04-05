import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    applyStoredMidiDefaults,
    MIDI_DEFAULT_INPUT_STORAGE_KEY,
    MIDI_DEFAULT_OUTPUT_STORAGE_KEY,
    persistDefaultMidiInput,
    persistDefaultMidiOutput,
} from '../../ui/editor/hooks/useMidiPreferences';

describe('MIDI preferences storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('F41-S18 persists default input id to localStorage', () => {
        persistDefaultMidiInput('device-in-1');
        expect(localStorage.getItem(MIDI_DEFAULT_INPUT_STORAGE_KEY)).toBe('device-in-1');
    });

    it('F41-S18 clears default input when null', () => {
        persistDefaultMidiInput('x');
        persistDefaultMidiInput(null);
        expect(localStorage.getItem(MIDI_DEFAULT_INPUT_STORAGE_KEY)).toBeNull();
    });

    it('F41-S18 persists default output id', () => {
        persistDefaultMidiOutput('device-out-1');
        expect(localStorage.getItem(MIDI_DEFAULT_OUTPUT_STORAGE_KEY)).toBe('device-out-1');
    });

    it('F41-S18 applyStoredMidiDefaults calls runtime setters', () => {
        const setDefaultInputId = vi.fn();
        const setDefaultOutputId = vi.fn();
        localStorage.setItem(MIDI_DEFAULT_INPUT_STORAGE_KEY, 'in-stored');
        localStorage.setItem(MIDI_DEFAULT_OUTPUT_STORAGE_KEY, 'out-stored');
        applyStoredMidiDefaults({
            setDefaultInputId,
            setDefaultOutputId,
        } as never);
        expect(setDefaultInputId).toHaveBeenCalledWith('in-stored');
        expect(setDefaultOutputId).toHaveBeenCalledWith('out-stored');
    });
});
