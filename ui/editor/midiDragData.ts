/** Drag payload when dropping a Web MIDI port from MidiDevicePanel onto the canvas. */
export const MIDI_DEVICE_DRAG_MIME = 'application/din-midi-device';

export type MidiDeviceDragPayload = {
    portType: 'input' | 'output';
    deviceId: string;
};

export function stringifyMidiDeviceDragPayload(payload: MidiDeviceDragPayload): string {
    return JSON.stringify(payload);
}

export function parseMidiDeviceDragPayload(raw: string): MidiDeviceDragPayload | null {
    try {
        const value = JSON.parse(raw) as unknown;
        if (
            value
            && typeof value === 'object'
            && 'deviceId' in value
            && 'portType' in value
            && typeof (value as MidiDeviceDragPayload).deviceId === 'string'
            && ((value as MidiDeviceDragPayload).portType === 'input'
                || (value as MidiDeviceDragPayload).portType === 'output')
        ) {
            return value as MidiDeviceDragPayload;
        }
    } catch {
        /* ignore */
    }
    return null;
}
