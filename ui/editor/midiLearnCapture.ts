import type { MidiInputEventData } from '@open-din/react/midi';
import type { MidiDetectionMode } from './midiDetectionStore';

export type MidiLearnCcCapture = {
    kind: 'cc';
    inputId: string;
    channel: number;
    cc: number;
    seq: number;
    receivedAt: number;
};

export type MidiLearnNoteCapture = {
    kind: 'note';
    inputId: string;
    channel: number;
    note: number;
    velocity: number;
    gate: boolean;
    seq: number;
    receivedAt: number;
};

export type MidiLearnCapture = MidiLearnCcCapture | MidiLearnNoteCapture;

/** Derives a learn snapshot from the last MIDI input event when detection mode is active. */
export function learnCaptureFromMidiEvent(
    mode: MidiDetectionMode,
    event: MidiInputEventData | null
): MidiLearnCapture | null {
    if (!event || mode === 'off') {
        return null;
    }

    if (mode === 'controllers' || mode === 'all') {
        if (event.kind === 'cc' && event.channel !== null && event.cc !== null) {
            return {
                kind: 'cc',
                inputId: event.inputId,
                channel: event.channel,
                cc: event.cc,
                seq: event.seq,
                receivedAt: event.receivedAt,
            };
        }
    }

    if (mode === 'keys' || mode === 'all') {
        if ((event.kind === 'noteon' || event.kind === 'noteoff') && event.channel !== null && event.note !== null) {
            const gate = event.kind === 'noteon' && (event.velocity ?? 0) > 0;
            return {
                kind: 'note',
                inputId: event.inputId,
                channel: event.channel,
                note: event.note,
                velocity: event.velocity ?? 0,
                gate,
                seq: event.seq,
                receivedAt: event.receivedAt,
            };
        }
    }

    return null;
}
