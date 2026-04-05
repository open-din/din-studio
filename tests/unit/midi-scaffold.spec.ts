import { describe, expect, it, vi } from 'vitest';
import { computeDeviceScaffoldPositions } from '../../ui/editor/deviceScaffoldLayout';
import { ddjXp2Profile } from '../../ui/editor/deviceProfiles';

describe('computeDeviceScaffoldPositions (DDJ-XP2)', () => {
    it('F16-S06 emits one position per control', () => {
        const anchor = { x: 500, y: 400 };
        const positions = computeDeviceScaffoldPositions(ddjXp2Profile, anchor);
        expect(positions).toHaveLength(ddjXp2Profile.controls.length);
    });

    it('F16-S06 places left pad cluster west of right pad cluster', () => {
        const anchor = { x: 500, y: 400 };
        const positions = computeDeviceScaffoldPositions(ddjXp2Profile, anchor);
        const leftPads = ddjXp2Profile.controls
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => c.group === 'pads-left');
        const rightPads = ddjXp2Profile.controls
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => c.group === 'pads-right');

        const leftXs = leftPads.map(({ i }) => positions[i].x);
        const rightXs = rightPads.map(({ i }) => positions[i].x);

        const maxLeft = Math.max(...leftXs);
        const minRight = Math.min(...rightXs);
        expect(maxLeft).toBeLessThan(minRight);
    });
});

describe('scaffoldRecognizedMidiDevice', () => {
    it('F16-S06 adds one node per profile control and preserves existing nodes (non-destructive)', async () => {
        vi.resetModules();
        const { audioEngine } = await import('../../ui/editor/AudioEngine');
        vi.spyOn(audioEngine, 'refreshConnections').mockImplementation(() => {});
        vi.spyOn(audioEngine, 'refreshDataValues').mockImplementation(() => {});
        vi.spyOn(audioEngine, 'updateNode').mockImplementation(() => {});

        const { useAudioGraphStore } = await import('../../ui/editor/store');
        const { ddjXp2Profile: profile } = await import('../../ui/editor/deviceProfiles');

        const idsBefore = new Set(useAudioGraphStore.getState().nodes.map((n) => n.id));
        const before = idsBefore.size;
        useAudioGraphStore.getState().scaffoldRecognizedMidiDevice(profile, 'test-input-id', { x: 200, y: 200 });

        const after = useAudioGraphStore.getState().nodes;
        expect(after).toHaveLength(before + profile.controls.length);
        for (const id of idsBefore) {
            expect(after.some((n) => n.id === id)).toBe(true);
        }

        const added = after.slice(before);
        const midiNotes = added.filter((n) => n.data.type === 'midiNote');
        const midiCcs = added.filter((n) => n.data.type === 'midiCC');
        expect(midiNotes).toHaveLength(32);
        expect(midiCcs).toHaveLength(3);

        const firstPad = midiNotes.find((n) => n.data.label === 'Pad L1');
        expect(firstPad?.data.type).toBe('midiNote');
        if (firstPad?.data.type === 'midiNote') {
            expect(firstPad.data.inputId).toBe('test-input-id');
            expect(firstPad.data.channel).toBe(1);
            expect(firstPad.data.noteMode).toBe('single');
            expect(firstPad.data.note).toBe(0);
        }

        const stripL = midiCcs.find((n) => n.data.label === 'Touch strip L');
        expect(stripL?.data.type).toBe('midiCC');
        if (stripL?.data.type === 'midiCC') {
            expect(stripL.data.inputId).toBe('test-input-id');
            expect(stripL.data.channel).toBe(1);
            expect(stripL.data.cc).toBe(3);
        }
    });
});
