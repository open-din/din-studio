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
import type { MidiCCOutputNodeData } from '../../ui/editor/types';
import { buildOutputOptions } from './midiNodeUtils';

const MidiCCOutputNode = memo(({ id, data, selected }: NodeProps) => {
    const midiData = data as MidiCCOutputNodeData;
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const midi = useMidi();
    const valueConnection = useTargetHandleConnection(id, 'value');

    const handleChange = (patch: Partial<MidiCCOutputNodeData>) => {
        updateNodeData(id, patch);
        audioEngine.updateNode(id, patch);
    };

    const status = midi.lastOutputEvent?.kind === 'cc' ? 'Sending' : 'Ready';
    const outputOptions = useMemo(() => buildOutputOptions(midi.outputs, midiData.outputId), [midi.outputs, midiData.outputId]);
    const selectedOutputLabel = outputOptions.find((option) => option.value === (midiData.outputId ?? ''))?.label ?? 'Default';

    return (
        <NodeShell
            nodeType="midiCCOutput"
            title={midiData.label?.trim() || 'CC Out'}
            selected={selected}
            badge={<NodeValueBadge live={status === 'Sending'}>{status}</NodeValueBadge>}
        >
            <NodeWidget title={<NodeWidgetTitle icon="midiCCOutput">Destination + value</NodeWidgetTitle>}>
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

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Controller</span>
                    <NodeNumberField min={0} max={127} step={1} value={midiData.cc} onChange={(value) => handleChange({ cc: value })} />
                </div>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Value Mode</span>
                    <NodeSelectField
                        value={midiData.valueFormat}
                        onChange={(value) => handleChange({ valueFormat: value as MidiCCOutputNodeData['valueFormat'] })}
                    >
                        <option value="normalized">Normalized</option>
                        <option value="raw">Raw</option>
                    </NodeSelectField>
                </div>

                <NodeValueBadge>{selectedOutputLabel}</NodeValueBadge>
            </NodeWidget>

            <NodeHandleRow
                direction="target"
                label="value"
                handleId="value"
                handleKind="control"
                control={valueConnection.connected ? (
                    <NodeValueBadge live>{formatConnectedValue(valueConnection.value)}</NodeValueBadge>
                ) : (
                    <NodeNumberField
                        className="node-shell__row-field"
                        min={0}
                        max={midiData.valueFormat === 'raw' ? 127 : 1}
                        step={midiData.valueFormat === 'raw' ? 1 : 0.01}
                        value={midiData.value}
                        onChange={(value) => handleChange({ value })}
                    />
                )}
            />
        </NodeShell>
    );
});

MidiCCOutputNode.displayName = 'MidiCCOutputNode';
export default MidiCCOutputNode;
