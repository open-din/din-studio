import { memo, useMemo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useMidi } from '@open-din/react/midi';
import { audioEngine } from '../../ui/editor/AudioEngine';
import {
    NodeHandleRow,
    NodeNumberField,
    NodeSelectField,
    NodeShell,
    NodeValueBadge,
    NodeWidget,
    NodeWidgetTitle,
} from '../../ui/editor/components/NodeShell';
import { formatConnectedValue, useTargetHandleConnection } from '../../ui/editor/paramConnections';
import { useAudioGraphStore } from '../../ui/editor/store';
import type { MidiNoteOutputNodeData } from '../../ui/editor/types';
import { buildOutputOptions } from './midiNodeUtils';

const MidiNoteOutputNode = memo(({ id, data, selected }: NodeProps) => {
    const midiData = data as MidiNoteOutputNodeData;
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const midi = useMidi();
    const gateConnection = useTargetHandleConnection(id, 'gate');
    const noteConnection = useTargetHandleConnection(id, 'note');
    const frequencyConnection = useTargetHandleConnection(id, 'frequency');
    const velocityConnection = useTargetHandleConnection(id, 'velocity');

    const handleChange = (patch: Partial<MidiNoteOutputNodeData>) => {
        updateNodeData(id, patch);
        audioEngine.updateNode(id, patch);
    };

    const status = midi.lastOutputEvent?.kind === 'noteon' ? 'Sending' : 'Ready';
    const outputOptions = useMemo(() => buildOutputOptions(midi.outputs, midiData.outputId), [midi.outputs, midiData.outputId]);
    const selectedOutputLabel = outputOptions.find((option) => option.value === (midiData.outputId ?? ''))?.label ?? 'Default';

    return (
        <NodeShell
            nodeType="midiNoteOutput"
            title={midiData.label?.trim() || 'Note Out'}
            selected={selected}
            badge={<NodeValueBadge live={status === 'Sending'}>{status}</NodeValueBadge>}
        >
            <NodeWidget title={<NodeWidgetTitle icon="midiNoteOutput">Destination + note data</NodeWidgetTitle>}>
                {midi.status !== 'granted' ? (
                    <button type="button" className="ui-token-trigger-row" onClick={() => void midi.requestAccess()}>
                        <span>Connect MIDI</span>
                        <span className="ui-token-trigger-row-icon" aria-hidden="true">MIDI</span>
                    </button>
                ) : null}

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Output Device</span>
                    <NodeSelectField value={midiData.outputId ?? ''} onChange={(value) => handleChange({ outputId: value || null })}>
                        {outputOptions.map((option) => (
                            <option key={option.value} value={option.value} disabled={option.disabled}>
                                {option.label}
                            </option>
                        ))}
                    </NodeSelectField>
                </div>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Channel</span>
                    <NodeNumberField min={1} max={16} step={1} value={midiData.channel} onChange={(value) => handleChange({ channel: value })} />
                </div>

                <NodeValueBadge>{selectedOutputLabel}</NodeValueBadge>
            </NodeWidget>

            <NodeHandleRow
                direction="target"
                label="trigger"
                handleId="trigger"
                handleKind="trigger"
                control={<NodeValueBadge live={status === 'Sending'}>{status === 'Sending' ? 'pulse' : 'armed'}</NodeValueBadge>}
            />
            <NodeHandleRow
                direction="target"
                label="gate"
                handleId="gate"
                handleKind="trigger"
                control={gateConnection.connected ? (
                    <NodeValueBadge live>{formatConnectedValue(gateConnection.value)}</NodeValueBadge>
                ) : (
                    <NodeSelectField
                        className="node-shell__row-field"
                        value={String(midiData.gate)}
                        onChange={(value) => handleChange({ gate: Number(value) })}
                    >
                        <option value="0">Off</option>
                        <option value="1">On</option>
                    </NodeSelectField>
                )}
            />
            <NodeHandleRow
                direction="target"
                label="note"
                handleId="note"
                handleKind="control"
                control={noteConnection.connected ? (
                    <NodeValueBadge live>{formatConnectedValue(noteConnection.value, (value) => String(Math.round(value)))}</NodeValueBadge>
                ) : (
                    <NodeNumberField className="node-shell__row-field" min={0} max={127} step={1} value={midiData.note} onChange={(value) => handleChange({ note: value })} />
                )}
            />
            <NodeHandleRow
                direction="target"
                label="frequency"
                handleId="frequency"
                handleKind="control"
                control={frequencyConnection.connected ? (
                    <NodeValueBadge live>{formatConnectedValue(frequencyConnection.value, (value) => `${Math.round(value)} Hz`)}</NodeValueBadge>
                ) : (
                    <NodeNumberField className="node-shell__row-field" min={1} step={0.1} value={midiData.frequency} onChange={(value) => handleChange({ frequency: value })} />
                )}
            />
            <NodeHandleRow
                direction="target"
                label="velocity"
                handleId="velocity"
                handleKind="control"
                control={velocityConnection.connected ? (
                    <NodeValueBadge live>{formatConnectedValue(velocityConnection.value)}</NodeValueBadge>
                ) : (
                    <NodeNumberField className="node-shell__row-field" min={0} max={1} step={0.01} value={midiData.velocity} onChange={(value) => handleChange({ velocity: value })} />
                )}
            />
        </NodeShell>
    );
});

MidiNoteOutputNode.displayName = 'MidiNoteOutputNode';
export default MidiNoteOutputNode;
