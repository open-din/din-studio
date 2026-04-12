/**
 * Imports the real AudioEngine (not the vitest stub) to verify Faust-mode guards.
 * Vitest aliases paths ending in /AudioEngine to the stub; importing AudioEngine.ts bypasses it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import type { AudioNodeData } from '../../ui/editor/types';
import { audioEngine } from '../../ui/editor/AudioEngine.ts';

beforeEach(() => {
    class MockAudioContext {
        state: AudioContextState = 'running';
        currentTime = 0;
        destination = {} as AudioDestinationNode;
        resume(): Promise<void> {
            return Promise.resolve();
        }
        suspend(): Promise<void> {
            return Promise.resolve();
        }
    }
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('webkitAudioContext', MockAudioContext);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const outputNode: Node<AudioNodeData> = {
    id: 'output-1',
    type: 'outputNode',
    position: { x: 0, y: 0 },
    data: { type: 'output', playing: false, masterGain: 0.5, label: 'Output' },
};

describe('AudioEngine faustMode', () => {
    afterEach(() => {
        audioEngine.stop();
        audioEngine.setFaustMode(false);
        (audioEngine as unknown as { audioContext: AudioContext | null }).audioContext = null;
    });

    it('refreshConnections does not invoke connectGraph when faustMode is true', () => {
        const proto = Object.getPrototypeOf(audioEngine) as { connectGraph: (n: unknown, e: unknown) => void };
        const connectGraphSpy = vi.spyOn(proto, 'connectGraph');

        audioEngine.setFaustMode(true);
        audioEngine.start([outputNode], [] as Edge[]);

        connectGraphSpy.mockClear();

        audioEngine.refreshConnections([outputNode], [] as Edge[]);

        expect(connectGraphSpy).not.toHaveBeenCalled();

        connectGraphSpy.mockRestore();
    });

    it('refreshDataValues does not run updateDataValues when faustMode is true', () => {
        const proto = Object.getPrototypeOf(audioEngine) as { updateDataValues: (n: unknown, e: unknown) => void };
        const updateDataValuesSpy = vi.spyOn(proto, 'updateDataValues');

        audioEngine.setFaustMode(true);
        audioEngine.start([outputNode], [] as Edge[]);

        updateDataValuesSpy.mockClear();

        audioEngine.refreshDataValues([outputNode], [] as Edge[]);

        expect(updateDataValuesSpy).not.toHaveBeenCalled();

        updateDataValuesSpy.mockRestore();
    });
});
