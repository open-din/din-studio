import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getStudioNodeDefinition, resolveStudioCustomComponentKey } from '../../ui/editor/nodeCatalog';
import { createDynamicNode } from '../../ui/editor/nodes/DynamicNode';
import { STUDIO_NODE_CUSTOM_VIEWS } from '../../ui/editor/nodeCustomViews/registry';

const studioViewCache = new Map<string, ComponentType<any>>();
function studioCatalogView(editorType: string): ComponentType<any> {
    let component = studioViewCache.get(editorType);
    if (!component) {
        const def = getStudioNodeDefinition(editorType);
        if (!def) {
            throw new Error(`Missing studio catalog definition for "${editorType}"`);
        }
        const key = resolveStudioCustomComponentKey(def);
        const Custom = key ? STUDIO_NODE_CUSTOM_VIEWS[key] : undefined;
        component = (Custom ?? createDynamicNode(def)) as ComponentType<any>;
        studioViewCache.set(editorType, component);
    }
    return component;
}

const OscNode = studioCatalogView('osc');
const GainNode = studioCatalogView('gain');
const OutputNode = studioCatalogView('output');
const InputNode = studioCatalogView('input');
const UiTokensNode = studioCatalogView('uiTokens');
const NoteNode = studioCatalogView('note');
const StepSequencerNodeView = studioCatalogView('stepSequencer');
const PianoRollNodeView = studioCatalogView('pianoRoll');
const MathNode = studioCatalogView('math');
const SwitchNode = studioCatalogView('switch');
const DelayNode = studioCatalogView('delay');
const ReverbNode = studioCatalogView('reverb');
const StereoPannerNode = studioCatalogView('panner');
const DistortionNode = studioCatalogView('distortion');
const ChorusNode = studioCatalogView('chorus');
const PhaserNode = studioCatalogView('phaser');
const FlangerNode = studioCatalogView('flanger');
const TremoloNode = studioCatalogView('tremolo');
const EQ3Node = studioCatalogView('eq3');
const NoiseBurstNode = studioCatalogView('noiseBurst');
const WaveShaperNode = studioCatalogView('waveShaper');
const ConvolverNode = studioCatalogView('convolver');
const AnalyzerNode = studioCatalogView('analyzer');
const Panner3DNode = studioCatalogView('panner3d');
const AuxSendNode = studioCatalogView('auxSend');
const AuxReturnNode = studioCatalogView('auxReturn');
const MatrixMixerNode = studioCatalogView('matrixMixer');
const ConstantSourceNode = studioCatalogView('constantSource');
const MediaStreamNode = studioCatalogView('mediaStream');
const EventTriggerNode = studioCatalogView('eventTrigger');
const CompressorNode = studioCatalogView('compressor');
const SamplerNode = studioCatalogView('sampler');
const MidiNoteNode = studioCatalogView('midiNote');
const MidiCCNode = studioCatalogView('midiCC');
const MidiNoteOutputNode = studioCatalogView('midiNoteOutput');
const MidiCCOutputNode = studioCatalogView('midiCCOutput');
const MidiSyncNode = studioCatalogView('midiSync');
const MidiPlayerNode = studioCatalogView('midiPlayer');
const PatchNode = studioCatalogView('patch');
import Inspector from '../../ui/editor/Inspector';
import { getInputParamHandleId } from '../../ui/editor/handleIds';
import { audioEngine } from '../../ui/editor/AudioEngine';

const updateNodeData = vi.fn();
const storeState = {
    updateNodeData,
    nodes: [] as any[],
    edges: [] as any[],
    graphs: [] as any[],
    activeGraphId: null as string | null,
    selectedNodeId: null as string | null,
};
const audioEngineMock = vi.hoisted(() => ({
    subscribeStep: vi.fn((callback: (step: number) => void) => {
        callback(2);
        return () => {};
    }),
}));
const audioLibraryMock = vi.hoisted(() => ({
    addAssetFromFile: vi.fn(async (file: File) => ({
        id: `asset-${file.name}`,
        name: file.name,
        fileName: file.name,
        relativePath: file.name.includes('plate')
            ? `impulses/${file.name}`
            : /\.(mid|midi|smf)$/i.test(file.name)
                ? `midi/${file.name}`
                : `samples/${file.name}`,
        kind: file.name.includes('plate') ? 'impulse' : /\.(mid|midi|smf)$/i.test(file.name) ? 'midi' : 'sample',
        mimeType: file.type || 'audio/wav',
        size: file.size,
        createdAt: 1,
        updatedAt: 1,
    })),
    getAssetObjectUrl: vi.fn(async (assetId: string) => `blob:${assetId}`),
    listAssets: vi.fn(async () => ([
        { id: 'asset-kick', name: 'kick.wav', fileName: 'kick.wav', relativePath: 'samples/kick.wav', kind: 'sample', mimeType: 'audio/wav', size: 256, createdAt: 1, updatedAt: 1 },
        { id: 'asset-plate.wav', name: 'plate.wav', fileName: 'plate.wav', relativePath: 'impulses/plate.wav', kind: 'impulse', mimeType: 'audio/wav', size: 512, createdAt: 1, updatedAt: 1 },
        { id: 'asset-clip', name: 'clip.mid', fileName: 'clip.mid', relativePath: 'midi/clip.mid', kind: 'midi', mimeType: 'audio/midi', size: 64, createdAt: 1, updatedAt: 1 },
    ])),
    listPatchSources: vi.fn(async () => ([
        { id: 'graph:graph-1', kind: 'graph', graphId: 'graph-1', name: 'Graph 1', fileName: 'graph-1.patch.json', relativePath: 'graphs/graph-1.patch.json', updatedAt: 1 },
        { id: 'graph:graph-2', kind: 'graph', graphId: 'graph-2', name: 'Graph 2', fileName: 'graph-2.patch.json', relativePath: 'graphs/graph-2.patch.json', updatedAt: 2 },
        { id: 'asset:asset-patch', kind: 'asset', assetId: 'asset-patch', name: 'nested.patch.json', fileName: 'nested.patch.json', relativePath: 'patches/nested.patch.json', updatedAt: 1 },
    ])),
    subscribeAssets: vi.fn(() => () => {}),
}));
const midiHookState = vi.hoisted(() => ({
    midi: {
        supported: true,
        status: 'idle',
        error: null,
        inputs: [] as Array<{ id: string; name: string }>,
        outputs: [] as Array<{ id: string; name: string }>,
        defaultInputId: null as string | null,
        defaultOutputId: null as string | null,
        defaultInput: null,
        defaultOutput: null,
        listenMode: 'default',
        lastInputEvent: null as any,
        lastOutputEvent: null as any,
        clock: null,
        requestAccess: vi.fn(async () => {}),
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
    },
    note: {
        gate: false,
        note: null as number | null,
        frequency: null as number | null,
        velocity: 0,
        channel: null as number | null,
        triggerToken: 0,
        activeNotes: [] as any[],
        lastEvent: null as any,
        source: { id: null as string | null, name: null as string | null },
    },
    cc: {
        raw: 0,
        normalized: 0,
        lastEvent: null as any,
        source: { id: null as string | null, name: null as string | null },
    },
    clock: {
        running: false,
        bpmEstimate: null as number | null,
        tickCount: 0,
        lastTickAt: null as number | null,
        source: { id: null as string | null, name: null as string | null },
    },
}));

vi.mock('@xyflow/react', () => ({
    Handle: ({
        id,
        type,
        position,
    }: {
        id?: string;
        type?: string;
        position?: string;
    }) => (
        <div
            data-testid={`handle-${id ?? 'default'}`}
            data-handle-type={type}
            data-position={position}
        />
    ),
    Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useNodeId: () => 'node-under-test',
    useHandleConnections: () => [],
    useNodesData: () => null,
    useOnSelectionChange: () => null,
}));

vi.mock('../../ui/editor/store', () => ({
    useAudioGraphStore: (selector: (state: Record<string, unknown>) => unknown) => selector(storeState),
}));

vi.mock('../../ui/editor/AudioEngine', () => ({
    audioEngine: {
        attachFaustDsp: vi.fn(),
        syncFaustParamsFromGraph: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        updateNode: vi.fn(),
        subscribeStep: audioEngineMock.subscribeStep,
        getContext: vi.fn(() => null),
        getControlInputValue: vi.fn(() => null),
        getSourceOutputValue: vi.fn(() => null),
        updateSamplerParam: vi.fn(),
        playSampler: vi.fn(),
        stopSampler: vi.fn(),
        loadSamplerBuffer: vi.fn(),
        onSamplerEnd: () => () => {},
        setFaustMode: vi.fn(),
    },
}));

vi.mock('../../ui/editor/audioLibrary', () => audioLibraryMock);

vi.mock('@open-din/react/midi', () => ({
    useMidi: () => midiHookState.midi,
    useMidiNote: () => midiHookState.note,
    useMidiCC: () => midiHookState.cc,
    useMidiClock: () => midiHookState.clock,
}));

describe('editor node UIs', () => {
    afterEach(() => {
        storeState.nodes = [];
        storeState.edges = [];
        storeState.graphs = [];
        storeState.activeGraphId = null;
        storeState.selectedNodeId = null;
        updateNodeData.mockClear();
        vi.mocked(audioEngine.updateNode).mockClear();
        audioLibraryMock.addAssetFromFile.mockClear();
        audioLibraryMock.getAssetObjectUrl.mockClear();
        audioLibraryMock.listAssets.mockClear();
        audioLibraryMock.subscribeAssets.mockClear();
        midiHookState.midi.supported = true;
        midiHookState.midi.status = 'idle';
        midiHookState.midi.error = null;
        midiHookState.midi.inputs = [];
        midiHookState.midi.outputs = [];
        midiHookState.midi.defaultInputId = null;
        midiHookState.midi.defaultOutputId = null;
        midiHookState.midi.defaultInput = null;
        midiHookState.midi.defaultOutput = null;
        midiHookState.midi.listenMode = 'default';
        midiHookState.midi.lastInputEvent = null;
        midiHookState.midi.lastOutputEvent = null;
        midiHookState.midi.requestAccess.mockClear();
        midiHookState.note.gate = false;
        midiHookState.note.note = null;
        midiHookState.note.frequency = null;
        midiHookState.note.velocity = 0;
        midiHookState.note.channel = null;
        midiHookState.note.triggerToken = 0;
        midiHookState.note.activeNotes = [];
        midiHookState.note.lastEvent = null;
        midiHookState.note.source = { id: null, name: null };
        midiHookState.cc.raw = 0;
        midiHookState.cc.normalized = 0;
        midiHookState.cc.lastEvent = null;
        midiHookState.cc.source = { id: null, name: null };
        midiHookState.clock.running = false;
        midiHookState.clock.bpmEstimate = null;
        midiHookState.clock.tickCount = 0;
        midiHookState.clock.lastTickAt = null;
        midiHookState.clock.source = { id: null, name: null };
        vi.unstubAllGlobals();
    });

    it('renders patch node shell with primary audio boundary handles', () => {
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        render(
            <PatchNode
                {...(sharedProps as any)}
                id="patch-1"
                data={{
                    type: 'patch',
                    label: 'Patch',
                    patchSourceId: '',
                    patchSourceKind: null,
                    patchAsset: null,
                    patchName: '',
                    patchInline: null,
                    inputs: [],
                    outputs: [],
                    audio: {
                        input: { id: 'in', label: 'Audio In', type: 'audio' },
                        output: { id: 'out', label: 'Audio Out', type: 'audio' },
                    },
                    sourceUpdatedAt: 0,
                    sourceError: null,
                }}
            />
        );

        expect(screen.getByText('Patch')).toBeInTheDocument();
        expect(screen.getByTestId('handle-in')).toBeInTheDocument();
        expect(screen.getByTestId('handle-out')).toBeInTheDocument();
    });

    it('reuses the same catalog view component for repeated osc lookups', () => {
        expect(studioCatalogView('osc')).toBe(studioCatalogView('osc'));
    });

    it('renders representative node families with their controls', () => {
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        render(
            <div>
                <InputNode
                    {...(sharedProps as any)}
                    id="input-1"
                    data={{
                        type: 'input',
                        label: 'Params',
                        params: [{ id: 'cutoff', name: 'cutoff', label: 'Cutoff', type: 'float', value: 440, defaultValue: 440, min: 20, max: 20000 }],
                    }}
                />
                <NoteNode {...(sharedProps as any)} id="note-1" data={{ type: 'note', note: 'C', octave: 4, frequency: 261.6, language: 'en', label: 'Note' }} />
                <OscNode {...(sharedProps as any)} id="osc-1" data={{ type: 'osc', frequency: 440, detune: 0, waveform: 'sine', label: 'Oscillator' }} />
                <OutputNode {...(sharedProps as any)} id="out-1" data={{ type: 'output', playing: false, masterGain: 0.5, label: 'Output' }} />
                <StepSequencerNodeView {...(sharedProps as any)} id="seq-1" data={{ type: 'stepSequencer', steps: 4, pattern: [1, 0, 1, 0], activeSteps: [true, false, true, false], label: 'Step Sequencer' }} />
                <PianoRollNodeView {...(sharedProps as any)} id="pr-1" data={{ type: 'pianoRoll', steps: 16, octaves: 2, baseNote: 48, notes: [], label: 'Piano Roll' }} />
                <DelayNode {...(sharedProps as any)} id="delay-1" data={{ type: 'delay', delayTime: 0.25, feedback: 0.5, label: 'Delay' }} />
                <ReverbNode {...(sharedProps as any)} id="reverb-1" data={{ type: 'reverb', decay: 2.5, mix: 0.4, label: 'Reverb' }} />
                <StereoPannerNode {...(sharedProps as any)} id="panner-1" data={{ type: 'panner', pan: 0.25, label: 'Pan' }} />
                <MathNode {...(sharedProps as any)} id="math-1" data={{ type: 'math', operation: 'add', a: 0, b: 1, c: 2, label: 'Math' }} />
                <SwitchNode {...(sharedProps as any)} id="switch-1" data={{ type: 'switch', inputs: 3, selectedIndex: 0, values: [0, 1, 2], label: 'Switch' }} />
            </div>
        );

        expect(screen.getByTestId('handle-param:cutoff')).toBeInTheDocument();
        expect(screen.getByText('Oscillator')).toBeInTheDocument();
        expect(screen.getByText('Output')).toBeInTheDocument();
        expect(screen.getByText('Step Sequencer')).toBeInTheDocument();
        expect(screen.getByText('step 3 / 4')).toBeInTheDocument();
        expect(screen.getByText('Piano Roll')).toBeInTheDocument();
        expect(screen.getByText('ROUTING')).toBeInTheDocument();
        expect(screen.getAllByText('MIDI').length).toBeGreaterThan(0);
        expect(screen.getByText('pattern')).toBeInTheDocument();
        expect(screen.getByText('notes')).toBeInTheDocument();
        expect(screen.getAllByLabelText('Steps').length).toBeGreaterThan(1);
        expect(screen.getByLabelText('Octaves')).toBeInTheDocument();
        expect(screen.getByLabelText('Base note')).toBeInTheDocument();
        expect(screen.getByTestId('handle-delayTime')).toBeInTheDocument();
        expect(screen.getByTestId('handle-feedback')).toBeInTheDocument();
        expect(screen.getByTestId('handle-decay')).toBeInTheDocument();
        expect(screen.getAllByTestId('handle-mix').length).toBeGreaterThan(0);
        expect(screen.getByTestId('handle-pan')).toBeInTheDocument();
        expect(screen.getByTestId('handle-masterGain')).toBeInTheDocument();
        expect(screen.getByText('Math')).toBeInTheDocument();
        expect(screen.getByText('Switch')).toBeInTheDocument();
        expect(screen.getAllByTestId(/handle-/).length).toBeGreaterThan(5);
    });

    it('keeps handles on left and right borders only, with sources on the right and targets on the left', () => {
        cleanup();

        render(
            <div>
                <OscNode
                    {...({
                        dragging: false,
                        selected: false,
                        zIndex: 0,
                        selectable: true,
                        draggable: true,
                        isConnectable: true,
                        positionAbsoluteX: 0,
                        positionAbsoluteY: 0,
                        xPos: 0,
                        yPos: 0,
                    } as any)}
                    id="osc-layout"
                    data={{ type: 'osc', frequency: 440, detune: 0, waveform: 'sine', label: 'Oscillator' }}
                />
            </div>
        );

        const sourceHandle = screen.getByTestId('handle-out');
        const targetHandles = [screen.getByTestId('handle-frequency'), screen.getByTestId('handle-detune')];

        expect(sourceHandle).toHaveAttribute('data-handle-type', 'source');
        expect(sourceHandle).toHaveAttribute('data-position', 'right');
        targetHandles.forEach((handle) => {
            expect(handle).toHaveAttribute('data-handle-type', 'target');
            expect(handle).toHaveAttribute('data-position', 'left');
        });
        expect(document.querySelector('[data-position="top"]')).toBeNull();
        expect(document.querySelector('[data-position="bottom"]')).toBeNull();
    });

    it('keeps only the frequency output on NoteNode', () => {
        cleanup();

        render(
            <NoteNode
                {...({
                    dragging: false,
                    selected: false,
                    zIndex: 0,
                    selectable: true,
                    draggable: true,
                    isConnectable: true,
                    positionAbsoluteX: 0,
                    positionAbsoluteY: 0,
                    xPos: 0,
                    yPos: 0,
                } as any)}
                id="note-only"
                data={{ type: 'note', note: 'C', octave: 4, frequency: 261.6, language: 'en', label: 'Note' }}
            />
        );

        expect(screen.getByTestId('handle-freq')).toBeInTheDocument();
        expect(screen.queryByTestId('handle-trigger')).not.toBeInTheDocument();
    });

    it('renders UI token parameter handles for each declared param', () => {
        cleanup();
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        const params = [
            { id: 'hoverToken', name: 'hoverToken', label: 'Hover Token', type: 'float' as const, value: 1, defaultValue: 0, min: 0, max: 9999 },
            { id: 'successToken', name: 'successToken', label: 'Success Token', type: 'float' as const, value: 2, defaultValue: 0, min: 0, max: 9999 },
            { id: 'errorToken', name: 'errorToken', label: 'Error Token', type: 'float' as const, value: 3, defaultValue: 0, min: 0, max: 9999 },
        ];

        render(
            <UiTokensNode
                {...(sharedProps as any)}
                id="ui-tokens-1"
                data={{
                    type: 'uiTokens',
                    label: 'UI Tokens',
                    params,
                }}
            />
        );

        expect(screen.getByTestId('handle-param:hoverToken')).toBeInTheDocument();
        expect(screen.getByTestId('handle-param:successToken')).toBeInTheDocument();
        expect(screen.getByTestId('handle-param:errorToken')).toBeInTheDocument();
    });

    it('allows adding and removing uiTokens params from the inspector panel', () => {
        cleanup();
        storeState.selectedNodeId = 'ui-tokens-1';
        storeState.nodes = [{
            id: 'ui-tokens-1',
            type: 'uiTokensNode',
            data: {
                type: 'uiTokens',
                label: 'UI Tokens',
                params: [
                    { id: 'hoverToken', name: 'hoverToken', label: 'Hover Token', type: 'float', value: 0, defaultValue: 0, min: 0, max: 9999 },
                ],
            },
        }];

        render(<Inspector />);

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));
        const labelFields = screen.getAllByLabelText('Label');
        fireEvent.change(labelFields[labelFields.length - 1]!, { target: { value: 'Warning Token' } });

        expect(updateNodeData).toHaveBeenCalledWith(
            'ui-tokens-1',
            expect.objectContaining({
                params: expect.arrayContaining([
                    expect.objectContaining({ id: 'hoverToken' }),
                    expect.objectContaining({ name: 'Warning Token', label: 'Warning Token' }),
                ]),
            })
        );

        updateNodeData.mockClear();
        fireEvent.click(screen.getByText('×'));
        expect(updateNodeData).toHaveBeenCalledWith(
            'ui-tokens-1',
            expect.objectContaining({
                params: [],
            })
        );
    });

    it('replaces slider with connected value when parameter handle is connected', () => {
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        const param = {
            id: 'gainParam',
            name: 'gainParam',
            label: 'Gain Param',
            type: 'float' as const,
            value: 0.72,
            defaultValue: 0.72,
            min: 0,
            max: 1,
        };

        storeState.nodes = [
            { id: 'input-1', data: { type: 'input', params: [param], label: 'Params' } },
            { id: 'gain-1', data: { type: 'gain', gain: 0.2, label: 'Gain' } },
        ];
        storeState.edges = [
            { id: 'e-1', source: 'input-1', sourceHandle: getInputParamHandleId(param), target: 'gain-1', targetHandle: 'gain' },
        ];

        render(
            <GainNode
                {...(sharedProps as any)}
                id="gain-1"
                data={{ type: 'gain', gain: 0.2, label: 'Gain' }}
            />
        );

        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('slider')).not.toBeInTheDocument();
        expect(screen.getByText('0.72')).toBeInTheDocument();
        expect(screen.queryByText(/incoming modulation value/i)).not.toBeInTheDocument();
    });

    it('renders a gauge slider with value for ranged numeric fields', () => {
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        render(
            <OutputNode
                {...(sharedProps as any)}
                id="output-1"
                data={{ type: 'output', masterGain: 0.42, playing: false, label: 'Output' }}
            />
        );

        expect(screen.getByText('0.42')).toBeInTheDocument();
        expect(screen.getByTestId('handle-masterGain')).toBeInTheDocument();
    });

    it('renders extended MVP feedback and routing node controls with stable handles', async () => {
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        render(
            <div>
                <CompressorNode {...(sharedProps as any)} id="compressor-1" data={{ type: 'compressor', threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25, sidechainStrength: 0.7, label: 'Compressor' }} />
                <DistortionNode {...(sharedProps as any)} id="distortion-1" data={{ type: 'distortion', distortionType: 'soft', drive: 0.4, level: 0.6, mix: 0.5, tone: 3200, label: 'Distortion' }} />
                <ChorusNode {...(sharedProps as any)} id="chorus-1" data={{ type: 'chorus', rate: 1.2, depth: 2.4, feedback: 0.2, delay: 18, mix: 0.3, stereo: true, label: 'Chorus' }} />
                <PhaserNode {...(sharedProps as any)} id="phaser-1" data={{ type: 'phaser', rate: 0.5, depth: 0.5, feedback: 0.7, baseFrequency: 1000, stages: 4, mix: 0.5, label: 'Phaser' }} />
                <FlangerNode {...(sharedProps as any)} id="flanger-1" data={{ type: 'flanger', rate: 0.2, depth: 2, feedback: 0.5, delay: 1, mix: 0.5, label: 'Flanger' }} />
                <TremoloNode {...(sharedProps as any)} id="tremolo-1" data={{ type: 'tremolo', rate: 4, depth: 0.5, waveform: 'sine', stereo: false, mix: 0.5, label: 'Tremolo' }} />
                <EQ3Node {...(sharedProps as any)} id="eq3-1" data={{ type: 'eq3', low: 0, mid: 0, high: 0, lowFrequency: 400, highFrequency: 2500, mix: 1, label: 'EQ3' }} />
                <NoiseBurstNode {...(sharedProps as any)} id="noise-burst-1" data={{ type: 'noiseBurst', noiseType: 'white', duration: 0.06, gain: 0.7, attack: 0.001, release: 0.02, label: 'Noise Burst' }} />
                <WaveShaperNode {...(sharedProps as any)} id="wave-shaper-1" data={{ type: 'waveShaper', amount: 0.45, preset: 'softClip', oversample: '2x', label: 'WaveShaper' }} />
                <ConvolverNode {...(sharedProps as any)} id="convolver-1" data={{ type: 'convolver', impulseSrc: '/impulses/plate.wav', normalize: true, label: 'Convolver' }} />
                <AnalyzerNode {...(sharedProps as any)} id="analyzer-1" data={{ type: 'analyzer', fftSize: 1024, smoothingTimeConstant: 0.8, updateRate: 60, autoUpdate: true, label: 'Analyzer' }} />
                <Panner3DNode {...(sharedProps as any)} id="panner3d-1" data={{ type: 'panner3d', positionX: 0, positionY: 0, positionZ: -1, refDistance: 1, maxDistance: 10000, rolloffFactor: 1, panningModel: 'HRTF', distanceModel: 'inverse', label: 'Panner 3D' }} />
                <AuxSendNode {...(sharedProps as any)} id="aux-send-1" data={{ type: 'auxSend', busId: 'aux', sendGain: 0.5, tap: 'pre', label: 'Aux Send' }} />
                <AuxReturnNode {...(sharedProps as any)} id="aux-return-1" data={{ type: 'auxReturn', busId: 'aux', gain: 1, label: 'Aux Return' }} />
                <MatrixMixerNode
                    {...(sharedProps as any)}
                    id="matrix-1"
                    data={{ type: 'matrixMixer', inputs: 2, outputs: 2, matrix: [[1, 0], [0, 1]], label: 'Matrix Mixer' }}
                />
                <ConstantSourceNode {...(sharedProps as any)} id="constant-source-1" data={{ type: 'constantSource', offset: 1, label: 'Constant Source' }} />
                <MediaStreamNode {...(sharedProps as any)} id="media-stream-1" data={{ type: 'mediaStream', requestMic: false, label: 'Media Stream' }} />
                <EventTriggerNode {...(sharedProps as any)} id="event-trigger-1" data={{ type: 'eventTrigger', token: 0, mode: 'change', cooldownMs: 40, velocity: 1, duration: 0.1, note: 60, trackId: 'event', label: 'Event Trigger' }} />
            </div>
        );

        await waitFor(() => {
            expect(screen.getByTitle('Select cached impulse response')).toBeInTheDocument();
        });

        expect(screen.getByTestId('handle-threshold')).toBeInTheDocument();
        expect(screen.getByTestId('handle-knee')).toBeInTheDocument();
        expect(screen.getByTestId('handle-ratio')).toBeInTheDocument();
        expect(screen.getByTestId('handle-sidechainIn')).toBeInTheDocument();
        expect(screen.getByTestId('handle-sidechainStrength')).toBeInTheDocument();
        expect(screen.getByTestId('handle-drive')).toBeInTheDocument();
        expect(screen.getByTestId('handle-level')).toBeInTheDocument();
        expect(screen.getAllByTestId('handle-mix').length).toBeGreaterThan(0);
        expect(screen.getByTestId('handle-tone')).toBeInTheDocument();
        expect(screen.getAllByTestId('handle-rate').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('handle-depth').length).toBeGreaterThan(0);
        expect(screen.getByTestId('handle-baseFrequency')).toBeInTheDocument();
        expect(screen.getByTestId('handle-stages')).toBeInTheDocument();
        expect(screen.getAllByTestId('handle-delay').length).toBeGreaterThan(0);
        expect(screen.getByTestId('handle-low')).toBeInTheDocument();
        expect(screen.getByTestId('handle-mid')).toBeInTheDocument();
        expect(screen.getByTestId('handle-high')).toBeInTheDocument();
        expect(screen.getByTestId('handle-lowFrequency')).toBeInTheDocument();
        expect(screen.getByTestId('handle-highFrequency')).toBeInTheDocument();
        expect(screen.getByTestId('handle-sendGain')).toBeInTheDocument();
        expect(screen.getAllByTestId('handle-gain').length).toBeGreaterThan(0);
        expect(screen.getByTestId('handle-in1')).toBeInTheDocument();
        expect(screen.getByTestId('handle-in2')).toBeInTheDocument();
        expect(screen.getByTestId('handle-out1')).toBeInTheDocument();
        expect(screen.getByTestId('handle-out2')).toBeInTheDocument();
        expect(screen.getByTestId('handle-cell:0:0')).toBeInTheDocument();
        expect(screen.getByTestId('handle-cell:1:1')).toBeInTheDocument();
        expect(screen.getAllByTestId('handle-trigger').length).toBeGreaterThan(0);
        expect(screen.getByTestId('handle-duration')).toBeInTheDocument();
        expect(screen.getByTestId('handle-amount')).toBeInTheDocument();
        expect(screen.getByTestId('handle-positionX')).toBeInTheDocument();
        expect(screen.getByTestId('handle-positionY')).toBeInTheDocument();
        expect(screen.getByTestId('handle-positionZ')).toBeInTheDocument();
        expect(screen.getByTestId('handle-refDistance')).toBeInTheDocument();
        expect(screen.getByTestId('handle-maxDistance')).toBeInTheDocument();
        expect(screen.getByTestId('handle-rolloffFactor')).toBeInTheDocument();
        expect(screen.getByTestId('handle-offset')).toBeInTheDocument();
        expect(screen.getByTestId('handle-token')).toBeInTheDocument();
        expect(screen.getByText('Media Stream')).toBeInTheDocument();
        expect(screen.getByText('Convolver')).toBeInTheDocument();
    });

    it('uploads an impulse audio file on ConvolverNode and stores a library asset reference', async () => {
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        const { container } = render(
            <ConvolverNode
                {...(sharedProps as any)}
                id="convolver-upload"
                data={{ type: 'convolver', impulseSrc: '', impulseFileName: '', normalize: true, label: 'Convolver' }}
            />
        );

        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
        expect(fileInput).not.toBeNull();

        await act(async () => {
            fireEvent.change(fileInput!, {
                target: {
                    files: [new File(['fake-impulse'], 'plate.wav', { type: 'audio/wav' })],
                },
            });
        });

        await waitFor(() => {
            expect(updateNodeData).toHaveBeenCalledWith(
                'convolver-upload',
                expect.objectContaining({
                    assetPath: 'impulses/plate.wav',
                    impulseId: 'asset-plate.wav',
                    impulseFileName: 'plate.wav',
                    impulseSrc: 'blob:asset-plate.wav',
                })
            );
        });

        expect(audioLibraryMock.addAssetFromFile).toHaveBeenCalledWith(
            expect.any(File),
            { kind: 'impulse' },
        );
        expect(audioEngine.updateNode).toHaveBeenCalledWith(
            'convolver-upload',
            expect.objectContaining({
                assetPath: 'impulses/plate.wav',
                impulseId: 'asset-plate.wav',
                impulseFileName: 'plate.wav',
                impulseSrc: 'blob:asset-plate.wav',
            })
        );
        expect(screen.getByText('plate.wav')).toBeInTheDocument();
    });

    it('selects a cached sample from the sampler dropdown search', async () => {
        cleanup();

        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        render(
            <SamplerNode
                {...(sharedProps as any)}
                id="sampler-select"
                data={{ type: 'sampler', src: '', sampleId: '', fileName: '', loop: false, playbackRate: 1, detune: 0, loaded: false, label: 'Sampler' }}
            />
        );

        await waitFor(() => {
            expect(screen.getByTitle('Select cached sample')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTitle('Select cached sample'), { target: { value: 'asset-kick' } });

        await waitFor(() => {
            expect(updateNodeData).toHaveBeenCalledWith(
                'sampler-select',
                expect.objectContaining({
                    assetPath: 'samples/kick.wav',
                    sampleId: 'asset-kick',
                    src: 'blob:asset-kick',
                    fileName: 'kick.wav',
                    loaded: true,
                })
            );
        });
    });

    it('renders MIDI note node handles from the studio catalog', () => {
        cleanup();
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        render(
            <MidiNoteNode
                {...(sharedProps as any)}
                id="midi-note-1"
                data={{
                    type: 'midiNote',
                    inputId: 'missing-input',
                    channel: 'all',
                    noteMode: 'all',
                    note: 60,
                    noteMin: 48,
                    noteMax: 72,
                    mappingEnabled: false,
                    mappings: [],
                    activeMappingId: null,
                    label: 'Piano / keys in',
                }}
            />
        );

        expect(screen.getByText('Piano / keys in')).toBeInTheDocument();
        expect(screen.getByTestId('handle-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('handle-frequency')).toBeInTheDocument();
        expect(screen.getByTestId('handle-note')).toBeInTheDocument();
        expect(screen.getByTestId('handle-gate')).toBeInTheDocument();
        expect(screen.getByTestId('handle-velocity')).toBeInTheDocument();
    });

    it('renders MIDI CC source handles and sync node shell', () => {
        cleanup();
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        render(
            <div>
                <MidiCCNode
                    {...(sharedProps as any)}
                    id="midi-cc-1"
                    data={{ type: 'midiCC', inputId: 'default', channel: 'all', cc: 1, label: 'Controllers (CC in)' }}
                />
                <MidiSyncNode
                    {...(sharedProps as any)}
                    id="midi-sync-1"
                    data={{ type: 'midiSync', mode: 'midi-master', inputId: 'knob-box', outputId: 'clock-out', sendStartStop: true, sendClock: true, label: 'Sync' }}
                />
            </div>
        );

        expect(screen.getByTestId('handle-normalized')).toBeInTheDocument();
        expect(screen.getByTestId('handle-raw')).toBeInTheDocument();
        expect(screen.getByText('Sync')).toBeInTheDocument();
    });

    it('renders MIDI Player title and transport/trigger handles', () => {
        cleanup();
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        render(
            <MidiPlayerNode
                {...(sharedProps as any)}
                id="midi-player-1"
                data={{
                    type: 'midiPlayer',
                    label: 'MIDI Player',
                    midiFileId: '',
                    midiFileName: '',
                    loaded: false,
                    loop: false,
                }}
            />
        );

        expect(screen.getByText('MIDI Player')).toBeInTheDocument();
        expect(screen.getByTestId('handle-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('handle-transport')).toBeInTheDocument();
    });

    it('renders MIDI output nodes with modulation handles when edges supply values', () => {
        cleanup();
        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        midiHookState.midi.status = 'granted';
        midiHookState.midi.outputs = [{ id: 'hardware-out', name: 'Hardware Out' }];

        const freqParam = {
            id: 'freq',
            name: 'freq',
            label: 'Freq',
            type: 'float' as const,
            value: 523.25,
            defaultValue: 523.25,
            min: 20,
            max: 20000,
        };
        const valueParam = {
            id: 'mod',
            name: 'mod',
            label: 'Mod',
            type: 'float' as const,
            value: 0.72,
            defaultValue: 0.72,
            min: 0,
            max: 1,
        };

        storeState.nodes = [
            { id: 'input-1', data: { type: 'input', label: 'Params', params: [freqParam, valueParam] } },
            { id: 'midi-note-out-1', data: { type: 'midiNoteOutput', outputId: 'missing-output', channel: 1, gate: 0, note: 60, frequency: 261.63, velocity: 1, label: 'Note Out' } },
            { id: 'midi-cc-out-1', data: { type: 'midiCCOutput', outputId: 'missing-cc-output', channel: 1, cc: 1, value: 0.25, valueFormat: 'normalized', label: 'CC Out' } },
        ];
        storeState.edges = [
            { id: 'freq-edge', source: 'input-1', sourceHandle: getInputParamHandleId(freqParam), target: 'midi-note-out-1', targetHandle: 'frequency' },
            { id: 'value-edge', source: 'input-1', sourceHandle: getInputParamHandleId(valueParam), target: 'midi-cc-out-1', targetHandle: 'value' },
        ];

        render(
            <div>
                <MidiNoteOutputNode
                    {...(sharedProps as any)}
                    id="midi-note-out-1"
                    data={{ type: 'midiNoteOutput', outputId: 'missing-output', channel: 1, gate: 0, note: 60, frequency: 261.63, velocity: 1, label: 'Note Out' }}
                />
                <MidiCCOutputNode
                    {...(sharedProps as any)}
                    id="midi-cc-out-1"
                    data={{ type: 'midiCCOutput', outputId: 'missing-cc-output', channel: 1, cc: 1, value: 0.25, valueFormat: 'normalized', label: 'CC Out' }}
                />
            </div>
        );

        expect(screen.getByText('523.25')).toBeInTheDocument();
        expect(screen.getByText('0.72')).toBeInTheDocument();
        expect(screen.getByTestId('handle-trigger')).toBeInTheDocument();
        expect(screen.getAllByTestId('handle-gate').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('handle-note').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('handle-frequency').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('handle-velocity').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('handle-value').length).toBeGreaterThan(0);
    });

    it('sizes sequencer instruments for mouse editing and marks the active column', () => {
        cleanup();

        const sharedProps = {
            dragging: false,
            selected: false,
            zIndex: 0,
            selectable: true,
            draggable: true,
            isConnectable: true,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            xPos: 0,
            yPos: 0,
        } as const;

        const { container } = render(
            <div>
                <StepSequencerNodeView
                    {...(sharedProps as any)}
                    id="seq-size"
                    data={{ type: 'stepSequencer', steps: 32, pattern: Array(32).fill(0.5), activeSteps: Array(32).fill(true), label: 'Step Sequencer' }}
                />
                <PianoRollNodeView
                    {...(sharedProps as any)}
                    id="piano-size"
                    data={{ type: 'pianoRoll', steps: 32, octaves: 4, baseNote: 48, notes: [{ pitch: 60, step: 2, duration: 2, velocity: 0.8 }], label: 'Piano Roll' }}
                />
            </div>
        );

        const sequencerRoot = container.querySelector('.sequencer-node') as HTMLElement | null;
        const pianoRoot = container.querySelector('.piano-roll-node') as HTMLElement | null;

        expect(sequencerRoot?.style.width).toBe('1000px');
        expect(pianoRoot?.style.width).toBe('928px');
        expect(container.querySelectorAll('.step-column.current-step-column').length).toBeGreaterThan(0);
        expect(container.querySelectorAll('.piano-cell.current').length).toBeGreaterThan(0);
        expect(container.querySelectorAll('.sequencer-pad').length).toBe(32);
        expect(container.querySelectorAll('.piano-grid-row').length).toBe(48);
    });
});
