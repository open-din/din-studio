import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { MidiDevicePanel } from '../../ui/editor/components/MidiDevicePanel';
import { MIDI_PANEL_COPY } from '../../ui/copy';
import { MIDI_DEVICE_DRAG_MIME } from '../../ui/editor/midiDragData';

type TestPort = {
    id: string;
    type: 'input' | 'output';
    name: string;
    manufacturer: string;
    state: 'connected' | 'disconnected';
    connection: 'open' | 'closed' | 'pending';
};

const midiHookState = vi.hoisted(() => ({
    supported: true,
    status: 'idle' as string,
    error: null as Error | null,
    inputs: [] as TestPort[],
    outputs: [] as TestPort[],
    defaultInputId: null as string | null,
    defaultOutputId: null as string | null,
    defaultInput: null,
    defaultOutput: null,
    listenMode: 'default' as const,
    lastInputEvent: null,
    lastOutputEvent: null,
    clock: {},
    requestAccess: vi.fn(),
    setDefaultInputId: vi.fn(),
    setDefaultOutputId: vi.fn(),
    setListenMode: vi.fn(),
    sendNoteOn: vi.fn(),
    sendNoteOff: vi.fn(),
    sendCC: vi.fn(),
    sendStart: vi.fn(),
    sendStop: vi.fn(),
    sendContinue: vi.fn(),
    sendClock: vi.fn(),
}));

vi.mock('@open-din/react/midi', () => ({
    useMidi: () => midiHookState,
}));

describe('MidiDevicePanel', () => {
    beforeEach(() => {
        midiHookState.supported = true;
        midiHookState.status = 'idle';
        midiHookState.error = null;
        midiHookState.inputs = [];
        midiHookState.outputs = [];
        midiHookState.defaultInputId = null;
        midiHookState.defaultOutputId = null;
        midiHookState.lastInputEvent = null;
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('F41-S10 shows Connect MIDI when status is idle', () => {
        render(<MidiDevicePanel />);
        expect(screen.getByTestId('midi-connect-button')).toHaveTextContent(MIDI_PANEL_COPY.connect);
    });

    it('F41-S11 shows empty state when granted with no devices', () => {
        midiHookState.status = 'granted';
        render(<MidiDevicePanel />);
        expect(screen.getByText(MIDI_PANEL_COPY.emptyNoDevices)).toBeInTheDocument();
    });

    it('F41-S12 renders device rows when ports exist', () => {
        midiHookState.status = 'granted';
        midiHookState.inputs = [{
            id: 'in-1',
            type: 'input',
            name: 'USB Keys',
            manufacturer: 'Acme',
            state: 'connected',
            connection: 'open',
        }];
        midiHookState.outputs = [{
            id: 'out-1',
            type: 'output',
            name: 'Synth',
            manufacturer: 'Acme',
            state: 'connected',
            connection: 'open',
        }];
        render(<MidiDevicePanel />);
        expect(screen.getByText('USB Keys')).toBeInTheDocument();
        expect(screen.getByText('Synth')).toBeInTheDocument();
    });

    it('F41-S13 calls setDefaultInputId when default in is pressed', () => {
        midiHookState.status = 'granted';
        midiHookState.inputs = [{
            id: 'in-1',
            type: 'input',
            name: 'USB Keys',
            manufacturer: 'Acme',
            state: 'connected',
            connection: 'open',
        }];
        render(<MidiDevicePanel />);
        fireEvent.click(screen.getByTestId('midi-set-default-in'));
        expect(midiHookState.setDefaultInputId).toHaveBeenCalledWith('in-1');
    });

    it('F41-S14 marks default input with default badge', () => {
        midiHookState.status = 'granted';
        midiHookState.defaultInputId = 'in-1';
        midiHookState.inputs = [{
            id: 'in-1',
            type: 'input',
            name: 'USB Keys',
            manufacturer: 'Acme',
            state: 'connected',
            connection: 'open',
        }];
        render(<MidiDevicePanel />);
        expect(screen.getByText(MIDI_PANEL_COPY.defaultBadge)).toBeInTheDocument();
    });

    it('F41-S15 sets drag data for input device rows', () => {
        midiHookState.status = 'granted';
        midiHookState.inputs = [{
            id: 'in-1',
            type: 'input',
            name: 'USB Keys',
            manufacturer: 'Acme',
            state: 'connected',
            connection: 'open',
        }];
        const setData = vi.fn();
        render(<MidiDevicePanel />);
        const row = screen.getByTestId('midi-device-row');
        fireEvent.dragStart(row, {
            dataTransfer: { setData, effectAllowed: 'uninitialized' } as unknown as DataTransfer,
        });
        expect(setData).toHaveBeenCalledWith('application/reactflow', 'midiNote');
        expect(setData).toHaveBeenCalledWith(
            MIDI_DEVICE_DRAG_MIME,
            JSON.stringify({ portType: 'input', deviceId: 'in-1' })
        );
    });
});
