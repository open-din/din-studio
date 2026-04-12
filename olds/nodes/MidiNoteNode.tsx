import { memo, useEffect, useMemo, useRef } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useMidi, useMidiNote } from '@open-din/react/midi';
import { normalizeMidiNoteNodeData } from '../../ui/editor/nodeHelpers';
import {
    NodeHandleRow,
    NodeNumberField,
    NodeSelectField,
    NodeShell,
    NodeValueBadge,
    NodeWidget,
    NodeWidgetTitle,
} from '../../ui/editor/components/NodeShell';
import { MIDI_PANEL_COPY } from '../../ui/copy';
import { useAudioGraphStore } from '../../ui/editor/store';
import type { MidiInMapping, MidiNoteNodeData } from '../../ui/editor/types';
import { useMidiDetectionStore } from '../../ui/editor/midiDetectionStore';
import { buildInputOptions, getChannelFilterValue, getStatusBadge } from './midiNodeUtils';

const createMappingId = (inputId: string, channel: number) => `${inputId}:${channel}`;

const findMappingIdForSelection = (
    mappings: MidiInMapping[],
    inputId: MidiNoteNodeData['inputId'],
    channel: MidiNoteNodeData['channel']
): string | null => {
    if (inputId === 'default' || inputId === 'all' || channel === 'all') return null;
    return mappings.find((mapping) => mapping.inputId === inputId && mapping.channel === channel)?.mappingId ?? null;
};

const resolveInputLabel = (
    inputId: MidiNoteNodeData['inputId'],
    mappings: MidiInMapping[],
    availableInputs: Array<{ id: string; name: string }>
) => {
    if (inputId === 'default') return 'Default';
    if (inputId === 'all') return 'All Inputs';
    return availableInputs.find((input) => input.id === inputId)?.name
        ?? mappings.find((mapping) => mapping.inputId === inputId)?.inputName
        ?? `Missing: ${inputId}`;
};

const describeSelection = (
    data: MidiNoteNodeData,
    availableInputs: Array<{ id: string; name: string }>
) => `${resolveInputLabel(data.inputId, data.mappings, availableInputs)} / ${data.channel === 'all' ? 'All Channels' : `Ch ${data.channel}`}`;

const getMostRecentMapping = (mappings: MidiInMapping[]) =>
    [...mappings].sort((left, right) => right.lastSeenAt - left.lastSeenAt)[0] ?? null;

const MidiNoteNode = memo(({ id, data, selected }: NodeProps) => {
    const midiData = useMemo(() => normalizeMidiNoteNodeData(data as MidiNoteNodeData), [data]);
    const panelLearnNote = useMidiDetectionStore((state) =>
        state.lastCapture?.kind === 'note' ? state.lastCapture : null
    );
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const midi = useMidi();
    const midiNote = useMidiNote({
        inputId: midiData.inputId,
        channel: midiData.channel,
        note: midiData.noteMode === 'single'
            ? midiData.note
            : midiData.noteMode === 'range'
                ? [midiData.noteMin, midiData.noteMax]
                : undefined,
    });
    const learnBaselineSeqRef = useRef<number | null>(null);
    const previousMappingEnabledRef = useRef(midiData.mappingEnabled);

    const inputOptions = useMemo(
        () => buildInputOptions(midi.inputs, midiData.inputId),
        [midi.inputs, midiData.inputId]
    );
    const activeMapping = useMemo(
        () => midiData.mappings.find((mapping) => mapping.mappingId === midiData.activeMappingId) ?? null,
        [midiData.activeMappingId, midiData.mappings]
    );
    const sortedMappings = useMemo(
        () => [...midiData.mappings].sort((left, right) => right.lastSeenAt - left.lastSeenAt),
        [midiData.mappings]
    );
    const connectedInputIds = useMemo(
        () => new Set(midi.inputs.map((input) => input.id)),
        [midi.inputs]
    );

    const commitPatch = (
        patch: Partial<MidiNoteNodeData>,
        options?: { syncActiveMappingFromSelection?: boolean; history?: 'auto' | 'skip'; mergeKey?: string }
    ) => {
        const merged = { ...midiData, ...patch } as MidiNoteNodeData;

        if (options?.syncActiveMappingFromSelection && !('activeMappingId' in patch)) {
            merged.activeMappingId = findMappingIdForSelection(
                Array.isArray(merged.mappings) ? merged.mappings : [],
                merged.inputId,
                merged.channel
            );
        }

        const nextData = normalizeMidiNoteNodeData(merged);
        if (options?.history || options?.mergeKey) {
            updateNodeData(id, nextData, {
                history: options.history,
                mergeKey: options.mergeKey,
            });
            return;
        }

        updateNodeData(id, nextData);
    };

    useEffect(() => {
        if (midiData.mappingEnabled && !previousMappingEnabledRef.current) {
            learnBaselineSeqRef.current = midi.lastInputEvent?.seq ?? null;
        }
        previousMappingEnabledRef.current = midiData.mappingEnabled;
    }, [midi.lastInputEvent?.seq, midiData.mappingEnabled]);

    useEffect(() => {
        const event = midi.lastInputEvent;
        if (!midiData.mappingEnabled || !event) return;
        if (event.kind !== 'noteon' && event.kind !== 'noteoff') return;
        if (event.note === null || event.channel === null) return;
        if (learnBaselineSeqRef.current !== null && event.seq <= learnBaselineSeqRef.current) return;

        learnBaselineSeqRef.current = event.seq;

        const mappingId = createMappingId(event.inputId, event.channel);
        const inputName = midi.inputs.find((input) => input.id === event.inputId)?.name ?? event.inputId;
        const nextMapping: MidiInMapping = {
            mappingId,
            inputId: event.inputId,
            inputName,
            channel: event.channel,
            lastNote: event.note,
            lastVelocity: event.velocity ?? 0,
            lastSeenAt: event.receivedAt ?? Date.now(),
        };

        const nextMappings = midiData.mappings.some((mapping) => mapping.mappingId === mappingId)
            ? midiData.mappings.map((mapping) => mapping.mappingId === mappingId ? nextMapping : mapping)
            : [...midiData.mappings, nextMapping];

        commitPatch({
            mappings: nextMappings,
            activeMappingId: mappingId,
            inputId: event.inputId,
            channel: event.channel,
        }, { history: 'skip' });
    }, [id, midi.inputs, midi.lastInputEvent, midiData.mappingEnabled, midiData.mappings]);

    const status = getStatusBadge(midi.status, midiNote.gate);
    const activeSourceLabel = activeMapping
        ? `${activeMapping.inputName} / Ch ${activeMapping.channel}`
        : `Manual / ${describeSelection(midiData, midi.inputs)}`;

    const handleActivateMapping = (mappingId: string) => {
        const mapping = midiData.mappings.find((item) => item.mappingId === mappingId);
        if (!mapping) return;
        commitPatch({
            activeMappingId: mapping.mappingId,
            inputId: mapping.inputId,
            channel: mapping.channel,
        });
    };

    const handleRemoveMapping = (mappingId: string) => {
        const remainingMappings = midiData.mappings.filter((mapping) => mapping.mappingId !== mappingId);
        const removingActive = midiData.activeMappingId === mappingId;
        const fallbackMapping = removingActive ? getMostRecentMapping(remainingMappings) : null;

        commitPatch({
            mappings: remainingMappings,
            activeMappingId: removingActive ? fallbackMapping?.mappingId ?? null : midiData.activeMappingId,
            inputId: removingActive && fallbackMapping ? fallbackMapping.inputId : midiData.inputId,
            channel: removingActive && fallbackMapping ? fallbackMapping.channel : midiData.channel,
        });
    };

    return (
        <NodeShell
            nodeType="midiNote"
            title={midiData.label?.trim() || 'Piano / keys in'}
            selected={selected}
            badge={<NodeValueBadge live={status === 'Receiving'}>{status}</NodeValueBadge>}
        >
            <NodeHandleRow direction="source" label="trigger" handleId="trigger" handleKind="trigger" />
            <NodeHandleRow direction="source" label="frequency" handleId="frequency" handleKind="control" />
            <NodeHandleRow direction="source" label="note" handleId="note" handleKind="control" />
            <NodeHandleRow direction="source" label="gate" handleId="gate" handleKind="trigger" />
            <NodeHandleRow direction="source" label="velocity" handleId="velocity" handleKind="control" />

            <NodeWidget title={<NodeWidgetTitle icon="midiNote">Input + mapping</NodeWidgetTitle>}>
                {midi.status !== 'granted' ? (
                    <button type="button" className="ui-token-trigger-row" onClick={() => void midi.requestAccess()}>
                        <span>Connect MIDI</span>
                        <span className="ui-token-trigger-row-icon" aria-hidden="true">MIDI</span>
                    </button>
                ) : null}

                <button
                    type="button"
                    className={`node-shell__transport-button ${midiData.mappingEnabled ? 'is-live' : ''}`}
                    aria-pressed={midiData.mappingEnabled}
                    onClick={() => commitPatch({ mappingEnabled: !midiData.mappingEnabled })}
                >
                    <span>{midiData.mappingEnabled ? 'Map On' : 'Map Off'}</span>
                </button>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <NodeValueBadge>{activeSourceLabel}</NodeValueBadge>
                    <NodeValueBadge live={midiNote.gate}>{midiNote.note ?? '-'}</NodeValueBadge>
                    <NodeValueBadge>{midiNote.velocity.toFixed(2)}</NodeValueBadge>
                </div>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Mapped Sources</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sortedMappings.length === 0 ? (
                            <NodeValueBadge>{midiData.mappingEnabled ? 'Listening for MIDI...' : 'No mapped sources'}</NodeValueBadge>
                        ) : (
                            sortedMappings.map((mapping) => {
                                const isActive = mapping.mappingId === midiData.activeMappingId;
                                const isConnected = connectedInputIds.has(mapping.inputId);
                                return (
                                    <div key={mapping.mappingId} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                                        <button
                                            type="button"
                                            className="ui-token-trigger-row"
                                            aria-pressed={isActive}
                                            onClick={() => handleActivateMapping(mapping.mappingId)}
                                        >
                                            <span>{mapping.inputName} / Ch {mapping.channel}</span>
                                            <span className="ui-token-trigger-row-icon" aria-hidden="true">
                                                {isActive ? 'LIVE' : 'MAP'}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            className="node-shell__transport-button"
                                            aria-label={`Remove ${mapping.inputName} channel ${mapping.channel}`}
                                            onClick={() => handleRemoveMapping(mapping.mappingId)}
                                        >
                                            <span>DEL</span>
                                        </button>
                                        <NodeValueBadge>{isActive ? 'Active' : 'Mapped'} / {isConnected ? 'Connected' : 'Disconnected'}</NodeValueBadge>
                                        <NodeValueBadge>Note {mapping.lastNote} / Vel {mapping.lastVelocity.toFixed(2)}</NodeValueBadge>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Input Device</span>
                    <NodeSelectField
                        value={midiData.inputId}
                        onChange={(value) => commitPatch({ inputId: value as MidiNoteNodeData['inputId'] }, { syncActiveMappingFromSelection: true })}
                    >
                        {inputOptions.map((option) => (
                            <option key={option.value} value={option.value} disabled={option.disabled}>
                                {option.label}
                            </option>
                        ))}
                    </NodeSelectField>
                </div>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Channel</span>
                    <NodeSelectField
                        value={getChannelFilterValue(midiData.channel)}
                        onChange={(value) => commitPatch({
                            channel: value === 'all' ? 'all' : Number(value),
                        }, { syncActiveMappingFromSelection: true })}
                    >
                        <option value="all">All</option>
                        {Array.from({ length: 16 }, (_, index) => (
                            <option key={index + 1} value={index + 1}>{index + 1}</option>
                        ))}
                    </NodeSelectField>
                </div>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Filter</span>
                    <NodeSelectField
                        value={midiData.noteMode}
                        onChange={(value) => commitPatch({ noteMode: value as MidiNoteNodeData['noteMode'] })}
                    >
                        <option value="all">All Notes</option>
                        <option value="single">Single Note</option>
                        <option value="range">Range</option>
                    </NodeSelectField>
                </div>

                {midi.status === 'granted' && panelLearnNote && selected ? (
                    <div className="node-shell__widget-field">
                        <button
                            type="button"
                            className="node-shell__transport-button"
                            onClick={() =>
                                commitPatch(
                                    {
                                        inputId: panelLearnNote.inputId as MidiNoteNodeData['inputId'],
                                        channel: panelLearnNote.channel,
                                        noteMode: 'single',
                                        note: panelLearnNote.note,
                                    },
                                    { syncActiveMappingFromSelection: true }
                                )
                            }
                        >
                            <span>{MIDI_PANEL_COPY.nodeApply.useDetectedKey}</span>
                        </button>
                    </div>
                ) : null}

                {midiData.noteMode === 'single' ? (
                    <div className="node-shell__widget-field">
                        <span className="node-shell__widget-field-label">Note</span>
                        <NodeNumberField min={0} max={127} step={1} value={midiData.note} onChange={(value) => commitPatch({ note: value })} />
                    </div>
                ) : null}

                {midiData.noteMode === 'range' ? (
                    <>
                        <div className="node-shell__widget-field">
                            <span className="node-shell__widget-field-label">Note Min</span>
                            <NodeNumberField min={0} max={127} step={1} value={midiData.noteMin} onChange={(value) => commitPatch({ noteMin: value })} />
                        </div>
                        <div className="node-shell__widget-field">
                            <span className="node-shell__widget-field-label">Note Max</span>
                            <NodeNumberField min={0} max={127} step={1} value={midiData.noteMax} onChange={(value) => commitPatch({ noteMax: value })} />
                        </div>
                    </>
                ) : null}
            </NodeWidget>
        </NodeShell>
    );
});

MidiNoteNode.displayName = 'MidiNoteNode';
export default MidiNoteNode;
