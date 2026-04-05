import { type DragEvent, type FC, useCallback, useEffect } from 'react';
import { useMidi, type MidiPortDescriptor } from '@open-din/react/midi';
import { Crosshair, GripVertical, Radio, Star } from 'lucide-react';
import { MIDI_PANEL_COPY } from '../../copy';
import { MIDI_DEVICE_DRAG_MIME, stringifyMidiDeviceDragPayload } from '../midiDragData';
import type { EditorNodeType } from '../nodeCatalog';
import { persistDefaultMidiInput, persistDefaultMidiOutput } from '../hooks/useMidiPreferences';
import { learnCaptureFromMidiEvent } from '../midiLearnCapture';
import { useMidiDetectionStore, type MidiDetectionMode } from '../midiDetectionStore';
import { useAudioGraphStore } from '../store';
import type { AudioNodeData } from '../types';

function statusMessage(status: string, error: Error | null): string {
    switch (status) {
        case 'idle':
            return MIDI_PANEL_COPY.status.idle;
        case 'pending':
            return MIDI_PANEL_COPY.status.pending;
        case 'granted':
            return MIDI_PANEL_COPY.status.granted;
        case 'denied':
            return MIDI_PANEL_COPY.status.denied;
        case 'error':
            return error?.message || MIDI_PANEL_COPY.status.error;
        case 'unsupported':
            return MIDI_PANEL_COPY.status.unsupported;
        default:
            return status;
    }
}

function ConnectedDot({ connected }: { connected: boolean }) {
    return (
        <span
            className={`inline-block h-2 w-2 shrink-0 rounded-full ${connected ? 'bg-emerald-400' : 'bg-zinc-500'}`}
            title={connected ? MIDI_PANEL_COPY.connectionConnected : MIDI_PANEL_COPY.connectionNotConnected}
            aria-hidden
        />
    );
}

interface DeviceRowProps {
    port: MidiPortDescriptor;
    portType: 'input' | 'output';
    isDefault: boolean;
    onSetDefault: () => void;
    dragNodeType: EditorNodeType;
}

const DeviceRow: FC<DeviceRowProps> = ({ port, portType, isDefault, onSetDefault, dragNodeType }) => {
    const onDragStart = useCallback(
        (event: DragEvent) => {
            event.dataTransfer.setData('application/reactflow', dragNodeType);
            event.dataTransfer.setData(
                MIDI_DEVICE_DRAG_MIME,
                stringifyMidiDeviceDragPayload({ portType, deviceId: port.id })
            );
            event.dataTransfer.effectAllowed = 'copy';
        },
        [dragNodeType, port.id, portType]
    );

    return (
        <div
            className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-[12px] ${
                isDefault
                    ? 'border-[var(--accent)]/40 bg-[var(--accent-soft)]/30'
                    : 'border-[var(--panel-border)] bg-[var(--panel-bg)]'
            }`}
            data-testid="midi-device-row"
            data-midi-port-type={portType}
            data-midi-device-id={port.id}
            draggable
            onDragStart={onDragStart}
        >
            <GripVertical
                className="h-4 w-4 shrink-0 cursor-grab text-[var(--text-subtle)] active:cursor-grabbing"
                strokeWidth={1.8}
                aria-hidden
            />
            <ConnectedDot connected={port.state === 'connected'} />
            <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-[var(--text)]">{port.name}</div>
                <div className="truncate text-[10px] text-[var(--text-subtle)]">
                    {port.manufacturer || MIDI_PANEL_COPY.manufacturerUnknown}
                </div>
            </div>
            {isDefault && (
                <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-[var(--accent)]">
                    <Star className="h-3 w-3 fill-current" strokeWidth={1.5} aria-hidden />
                    {MIDI_PANEL_COPY.defaultBadge}
                </span>
            )}
            <button
                type="button"
                className="shrink-0 rounded border border-[var(--panel-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                data-testid={portType === 'input' ? 'midi-set-default-in' : 'midi-set-default-out'}
                onClick={(e) => {
                    e.stopPropagation();
                    onSetDefault();
                }}
            >
                {portType === 'input' ? MIDI_PANEL_COPY.setDefaultIn : MIDI_PANEL_COPY.setDefaultOut}
            </button>
        </div>
    );
};

const DETECTION_MODES: MidiDetectionMode[] = ['off', 'controllers', 'keys', 'all'];

function modeLabel(mode: MidiDetectionMode): string {
    switch (mode) {
        case 'controllers':
            return MIDI_PANEL_COPY.detection.modeControllers;
        case 'keys':
            return MIDI_PANEL_COPY.detection.modeKeys;
        case 'all':
            return MIDI_PANEL_COPY.detection.modeAll;
        default:
            return MIDI_PANEL_COPY.detection.modeOff;
    }
}

export const MidiDevicePanel: FC = () => {
    const midi = useMidi();
    const {
        supported,
        status,
        error,
        inputs,
        outputs,
        defaultInputId,
        defaultOutputId,
        requestAccess,
        setDefaultInputId,
        setDefaultOutputId,
        lastInputEvent,
    } = midi;

    const detectionMode = useMidiDetectionStore((s) => s.mode);
    const setDetectionMode = useMidiDetectionStore((s) => s.setMode);
    const lastLearnCapture = useMidiDetectionStore((s) => s.lastCapture);
    const setLastLearnCapture = useMidiDetectionStore((s) => s.setLastCapture);
    const clearLearnCapture = useMidiDetectionStore((s) => s.clearCapture);

    const addNode = useAudioGraphStore((s) => s.addNode);
    const nodes = useAudioGraphStore((s) => s.nodes);

    const flowPositionForNewNode = useCallback(() => ({
        x: 240 + (nodes.length % 10) * 28,
        y: 160 + Math.floor(nodes.length / 10) * 24,
    }), [nodes.length]);

    useEffect(() => {
        if (detectionMode === 'off') return;
        const next = learnCaptureFromMidiEvent(detectionMode, lastInputEvent);
        if (next) {
            setLastLearnCapture(next);
        }
    }, [detectionMode, lastInputEvent, setLastLearnCapture]);

    const showDeviceLists = supported && status === 'granted';
    const emptyGranted = showDeviceLists && inputs.length === 0 && outputs.length === 0;

    const handleDefaultIn = (id: string) => {
        setDefaultInputId(id);
        persistDefaultMidiInput(id);
    };

    const handleDefaultOut = (id: string) => {
        setDefaultOutputId(id);
        persistDefaultMidiOutput(id);
    };

    const placeControllerFromCapture = () => {
        if (!lastLearnCapture || lastLearnCapture.kind !== 'cc') return;
        const { inputId, channel, cc } = lastLearnCapture;
        addNode('midiCC', flowPositionForNewNode(), {
            inputId: inputId as never,
            channel,
            cc,
            label: MIDI_PANEL_COPY.detection.ccSummary(channel, cc),
        } as Partial<AudioNodeData>);
    };

    const placeKeysFromCapture = () => {
        if (!lastLearnCapture || lastLearnCapture.kind !== 'note') return;
        const { inputId, channel, note } = lastLearnCapture;
        addNode('midiNote', flowPositionForNewNode(), {
            inputId: inputId as never,
            channel,
            noteMode: 'single',
            note,
            label: MIDI_PANEL_COPY.detection.noteSummary(channel, note),
        } as Partial<AudioNodeData>);
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-transparent" data-testid="midi-device-panel">
            <div className="border-b border-[var(--panel-border)] p-4 space-y-3">
                <div className="flex items-start gap-2">
                    <Radio
                        className={`mt-0.5 h-4 w-4 shrink-0 ${status === 'pending' ? 'animate-pulse text-blue-400' : 'text-[var(--text-subtle)]'}`}
                        strokeWidth={1.8}
                        aria-hidden
                    />
                    <p className="text-[12px] leading-snug text-[var(--text-subtle)]">{statusMessage(status, error)}</p>
                </div>

                {supported && status !== 'granted' && status !== 'pending' && (
                    <button
                        type="button"
                        data-testid="midi-connect-button"
                        className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                        onClick={() => void requestAccess()}
                    >
                        {MIDI_PANEL_COPY.connect}
                    </button>
                )}

                {supported && status === 'idle' && (
                    <p className="text-[11px] text-[var(--text-subtle)]">{MIDI_PANEL_COPY.emptyHint}</p>
                )}

                {supported && status === 'granted' && (
                    <section className="space-y-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)]/20 p-3" data-testid="midi-detection-section">
                        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                            <Crosshair className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                            {MIDI_PANEL_COPY.detection.sectionTitle}
                        </h3>
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label={MIDI_PANEL_COPY.detection.sectionTitle}>
                            {DETECTION_MODES.map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    data-testid={`midi-detection-mode-${mode}`}
                                    className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                                        detectionMode === mode
                                            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                                            : 'border-[var(--panel-border)] text-[var(--text-subtle)] hover:border-[var(--accent)]/50 hover:text-[var(--text)]'
                                    }`}
                                    aria-pressed={detectionMode === mode}
                                    onClick={() => setDetectionMode(mode)}
                                >
                                    {modeLabel(mode)}
                                </button>
                            ))}
                        </div>
                        {detectionMode !== 'off' ? (
                            <p className="text-[11px] leading-snug text-[var(--text-subtle)]">
                                {MIDI_PANEL_COPY.detection.hintActive}
                            </p>
                        ) : null}
                        {detectionMode !== 'off' && (
                            <div className="space-y-2 rounded border border-[var(--panel-border)] bg-[var(--panel-bg)] p-2">
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                                    {MIDI_PANEL_COPY.detection.selectedLabel}
                                </div>
                                {lastLearnCapture ? (
                                    <div className="text-[12px] font-medium text-[var(--text)]">
                                        {lastLearnCapture.kind === 'cc'
                                            ? MIDI_PANEL_COPY.detection.ccSummary(lastLearnCapture.channel, lastLearnCapture.cc)
                                            : MIDI_PANEL_COPY.detection.noteSummary(lastLearnCapture.channel, lastLearnCapture.note)}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-[var(--text-subtle)]">{MIDI_PANEL_COPY.detection.noneYet}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {lastLearnCapture?.kind === 'cc' && (
                                        <button
                                            type="button"
                                            className="rounded bg-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-white"
                                            data-testid="midi-detection-add-cc"
                                            onClick={placeControllerFromCapture}
                                        >
                                            {MIDI_PANEL_COPY.detection.addCcNode}
                                        </button>
                                    )}
                                    {lastLearnCapture?.kind === 'note' && (
                                        <button
                                            type="button"
                                            className="rounded bg-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-white"
                                            data-testid="midi-detection-add-keys"
                                            onClick={placeKeysFromCapture}
                                        >
                                            {MIDI_PANEL_COPY.detection.addKeysFromNote}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="rounded border border-[var(--panel-border)] px-2 py-1 text-[11px] font-medium text-[var(--text)]"
                                        data-testid="midi-detection-add-piano"
                                        onClick={() => addNode('midiNote', flowPositionForNewNode())}
                                    >
                                        {MIDI_PANEL_COPY.detection.addFullPiano}
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded border border-[var(--panel-border)] px-2 py-1 text-[11px] font-medium text-[var(--text)]"
                                        data-testid="midi-detection-add-empty-cc"
                                        onClick={() => addNode('midiCC', flowPositionForNewNode())}
                                    >
                                        {MIDI_PANEL_COPY.detection.addEmptyCc}
                                    </button>
                                    {lastLearnCapture && (
                                        <button
                                            type="button"
                                            className="rounded border border-[var(--panel-border)] px-2 py-1 text-[11px] text-[var(--text-subtle)]"
                                            onClick={() => clearLearnCapture()}
                                        >
                                            {MIDI_PANEL_COPY.detection.clearSelection}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-6">
                {showDeviceLists && emptyGranted && (
                    <p className="text-[12px] text-[var(--text-subtle)]">{MIDI_PANEL_COPY.emptyNoDevices}</p>
                )}

                {showDeviceLists && inputs.length > 0 && (
                    <section className="space-y-2" aria-label={MIDI_PANEL_COPY.sectionInputs}>
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                            {MIDI_PANEL_COPY.sectionInputs}
                        </h3>
                        <p className="text-[10px] text-[var(--text-subtle)]">{MIDI_PANEL_COPY.dragHint}</p>
                        <div className="space-y-2">
                            {inputs.map((port) => (
                                <DeviceRow
                                    key={port.id}
                                    port={port}
                                    portType="input"
                                    isDefault={defaultInputId === port.id}
                                    onSetDefault={() => handleDefaultIn(port.id)}
                                    dragNodeType="midiNote"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {showDeviceLists && outputs.length > 0 && (
                    <section className="space-y-2" aria-label={MIDI_PANEL_COPY.sectionOutputs}>
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                            {MIDI_PANEL_COPY.sectionOutputs}
                        </h3>
                        <p className="text-[10px] text-[var(--text-subtle)]">{MIDI_PANEL_COPY.dragHint}</p>
                        <div className="space-y-2">
                            {outputs.map((port) => (
                                <DeviceRow
                                    key={port.id}
                                    port={port}
                                    portType="output"
                                    isDefault={defaultOutputId === port.id}
                                    onSetDefault={() => handleDefaultOut(port.id)}
                                    dragNodeType="midiNoteOutput"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {showDeviceLists && (
                    <section className="space-y-1 border-t border-[var(--panel-border)] pt-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                            {MIDI_PANEL_COPY.lastEvent}
                        </h3>
                        <pre className="max-h-24 overflow-auto rounded border border-[var(--panel-border)] bg-[var(--panel-muted)]/40 p-2 text-[10px] text-[var(--text-subtle)] whitespace-pre-wrap break-all">
                            {lastInputEvent ? JSON.stringify(lastInputEvent, null, 0) : MIDI_PANEL_COPY.noLastEvent}
                        </pre>
                    </section>
                )}
            </div>
        </div>
    );
};
