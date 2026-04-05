import { describe, expect, it } from 'vitest';
import { matchDeviceProfile } from '../../ui/editor/deviceProfiles';
import type { MidiPortDescriptor } from '@open-din/react/midi';

function port(partial: Partial<MidiPortDescriptor> & Pick<MidiPortDescriptor, 'id' | 'name'>): MidiPortDescriptor {
    return {
        type: 'input',
        state: 'connected',
        connection: 'open',
        manufacturer: '',
        ...partial,
    } as MidiPortDescriptor;
}

describe('matchDeviceProfile', () => {
    it('F16-S06 matches Pioneer DDJ-XP2 by manufacturer and name (case-insensitive)', () => {
        const profile = matchDeviceProfile(
            port({
                id: 'x',
                name: 'DDJ-XP2',
                manufacturer: 'Pioneer',
            })
        );
        expect(profile?.id).toBe('pioneer-ddj-xp2');
    });

    it('F16-S06 matches lowercase name and pioneer dj manufacturer', () => {
        const profile = matchDeviceProfile(
            port({
                id: 'x',
                name: 'ddj-xp2 MIDI',
                manufacturer: 'Pioneer DJ',
            })
        );
        expect(profile?.name).toBe('DDJ-XP2');
    });

    it('F16-S06 returns null for unknown device', () => {
        expect(
            matchDeviceProfile(
                port({
                    id: 'x',
                    name: 'APC Key 25',
                    manufacturer: 'Akai',
                })
            )
        ).toBeNull();
    });

    it('F16-S06 returns null when model matches but manufacturer is not Pioneer', () => {
        expect(
            matchDeviceProfile(
                port({
                    id: 'x',
                    name: 'DDJ-XP2',
                    manufacturer: 'Generic',
                })
            )
        ).toBeNull();
    });
});
