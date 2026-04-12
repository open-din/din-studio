import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useMidi, useMidiClock } from '@open-din/react/midi';
import { audioEngine } from '../../ui/editor/AudioEngine';
import {
    NodeCheckboxField,
    NodeSelectField,
    NodeShell,
    NodeValueBadge,
    NodeWidget,
    NodeWidgetTitle,
} from '../../ui/editor/components/NodeShell';
import { useAudioGraphStore } from '../../ui/editor/store';
import type { MidiSyncNodeData } from '../../ui/editor/types';
import { buildInputOptions, buildOutputOptions } from './midiNodeUtils';

const MidiSyncNode = memo(({ id, data, selected }: NodeProps) => {
    const midiData = data as MidiSyncNodeData;
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const midi = useMidi();
    const clock = useMidiClock({ inputId: midiData.inputId ?? undefined });

    const handleChange = (patch: Partial<MidiSyncNodeData>) => {
        updateNodeData(id, patch);
        audioEngine.updateNode(id, patch);
    };

    const clockBadge = clock.running ? 'Clock locked' : 'Clock idle';

    return (
        <NodeShell
            nodeType="midiSync"
            title={midiData.label?.trim() || 'Sync'}
            selected={selected}
            badge={<NodeValueBadge live={clock.running}>{clockBadge}</NodeValueBadge>}
        >
            <NodeWidget title={<NodeWidgetTitle icon="midiSync">Clock + transport</NodeWidgetTitle>}>
                {midi.status !== 'granted' ? (
                    <button type="button" className="ui-token-trigger-row" onClick={() => void midi.requestAccess()}>
                        <span>Connect MIDI</span>
                        <span className="ui-token-trigger-row-icon" aria-hidden="true">MIDI</span>
                    </button>
                ) : null}

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Mode</span>
                    <NodeSelectField
                        value={midiData.mode}
                        onChange={(value) => handleChange({ mode: value as MidiSyncNodeData['mode'] })}
                    >
                        <option value="transport-master">Transport Master</option>
                        <option value="midi-master">MIDI Master</option>
                    </NodeSelectField>
                </div>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Input Device</span>
                    <NodeSelectField
                        value={midiData.inputId ?? 'default'}
                        onChange={(value) => handleChange({ inputId: value === 'default' ? null : value })}
                    >
                        {buildInputOptions(midi.inputs, (midiData.inputId ?? 'default') as string | 'default' | 'all')
                            .filter((option) => option.value !== 'all')
                            .map((option) => (
                                <option key={option.value} value={option.value} disabled={option.disabled}>
                                    {option.label}
                                </option>
                            ))}
                    </NodeSelectField>
                </div>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Output Device</span>
                    <NodeSelectField
                        value={midiData.outputId ?? ''}
                        onChange={(value) => handleChange({ outputId: value || null })}
                    >
                        {buildOutputOptions(midi.outputs, midiData.outputId).map((option) => (
                            <option key={option.value} value={option.value} disabled={option.disabled}>
                                {option.label}
                            </option>
                        ))}
                    </NodeSelectField>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <NodeCheckboxField checked={midiData.sendStartStop} onChange={(checked) => handleChange({ sendStartStop: checked })} label="Send Start / Stop" />
                    <NodeCheckboxField checked={midiData.sendClock} onChange={(checked) => handleChange({ sendClock: checked })} label="Send Clock" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <NodeValueBadge>{clock.source.name ?? '-'}</NodeValueBadge>
                    <NodeValueBadge live={clock.running}>{clock.bpmEstimate ? clock.bpmEstimate.toFixed(1) : '-'}</NodeValueBadge>
                </div>
            </NodeWidget>
        </NodeShell>
    );
});

MidiSyncNode.displayName = 'MidiSyncNode';
export default MidiSyncNode;
