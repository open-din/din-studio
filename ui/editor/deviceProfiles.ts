import type { MidiPortDescriptor } from '@open-din/react/midi';
import type { DeviceControl, DeviceProfile } from './deviceProfileTypes';

/** TODO: verify pad note ranges and channels against official Pioneer DDJ-XP2 MIDI documentation. */
function createDdjXp2PadControls(): DeviceControl[] {
    const controls: DeviceControl[] = [];
    for (const ch of [1, 2] as const) {
        for (let i = 0; i < 16; i++) {
            controls.push({
                kind: 'note',
                channel: ch,
                note: i,
                label: `Pad ${ch === 1 ? 'L' : 'R'}${i + 1}`,
                group: ch === 1 ? 'pads-left' : 'pads-right',
                defaultNodeType: 'midiNote',
            });
        }
    }
    return controls;
}

/**
 * TODO: verify strip and encoder CC assignments against official Pioneer MIDI spec.
 * Placeholder CCs for v1 scaffold only.
 */
const ddjXp2TouchAndEncoder: DeviceControl[] = [
    {
        kind: 'cc',
        channel: 1,
        cc: 3,
        label: 'Touch strip L',
        group: 'touch-strip-left',
        defaultNodeType: 'midiCC',
    },
    {
        kind: 'cc',
        channel: 1,
        cc: 4,
        label: 'Touch strip R',
        group: 'touch-strip-right',
        defaultNodeType: 'midiCC',
    },
    {
        kind: 'cc',
        channel: 1,
        cc: 15,
        label: 'Encoder',
        group: 'encoder',
        defaultNodeType: 'midiCC',
    },
];

export const ddjXp2Profile: DeviceProfile = {
    id: 'pioneer-ddj-xp2',
    name: 'DDJ-XP2',
    manufacturer: 'Pioneer',
    layout: 'split-grid',
    columns: 4,
    controls: [...createDdjXp2PadControls(), ...ddjXp2TouchAndEncoder],
};

export function matchDeviceProfile(port: MidiPortDescriptor): DeviceProfile | null {
    const name = port.name?.toLowerCase() ?? '';
    const manufacturer = port.manufacturer?.toLowerCase() ?? '';

    if (manufacturer.includes('pioneer') && name.includes('ddj-xp2')) {
        return ddjXp2Profile;
    }

    return null;
}
