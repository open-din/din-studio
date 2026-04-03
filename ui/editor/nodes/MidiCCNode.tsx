import { memo, useEffect, useMemo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useMidi, useMidiCC } from '@open-din/react/midi';
import { audioEngine } from '../AudioEngine';
import {
    NodeHandleRow,
    NodeNumberField,
    NodeSelectField,
    NodeShell,
    NodeValueBadge,
    NodeWidget,
    NodeWidgetTitle,
} from '../components/NodeShell';
import { useAudioGraphStore } from '../store';
import type { MidiCCNodeData } from '../types';
import { buildInputOptions, getChannelFilterValue, getStatusBadge } from './midiNodeUtils';

const MidiCCNode = memo(({ id, data, selected }: NodeProps) => {
    const midiData = data as MidiCCNodeData;
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const midi = useMidi();
    const midiCC = useMidiCC({
        inputId: midiData.inputId,
        channel: midiData.channel,
        cc: midiData.cc,
    });
    const [learning, setLearning] = useState(false);

    useEffect(() => {
        const event = midi.lastInputEvent;
        if (!learning || !event || event.kind !== 'cc' || event.cc === null || event.channel === null) return;

        updateNodeData(id, {
            inputId: event.inputId,
            channel: event.channel,
            cc: event.cc,
        });
        audioEngine.updateNode(id, {
            inputId: event.inputId,
            channel: event.channel,
            cc: event.cc,
        });
        setLearning(false);
    }, [id, learning, midi.lastInputEvent, updateNodeData]);

    const inputOptions = useMemo(
        () => buildInputOptions(midi.inputs, midiData.inputId),
        [midi.inputs, midiData.inputId]
    );

    const handleChange = (patch: Partial<MidiCCNodeData>) => {
        updateNodeData(id, patch);
        audioEngine.updateNode(id, patch);
    };

    const status = getStatusBadge(midi.status, midiCC.lastEvent !== null);

    return (
        <NodeShell
            nodeType="midiCC"
            title={midiData.label?.trim() || 'Knob / CC In'}
            selected={selected}
            badge={<NodeValueBadge live={status === 'Receiving'}>{status}</NodeValueBadge>}
        >
            <NodeHandleRow direction="source" label="normalized" handleId="normalized" handleKind="control" />
            <NodeHandleRow direction="source" label="raw" handleId="raw" handleKind="control" />

            <NodeWidget title={<NodeWidgetTitle icon="midiCC">Controller + learn</NodeWidgetTitle>}>
                {midi.status !== 'granted' ? (
                    <button type="button" className="ui-token-trigger-row" onClick={() => void midi.requestAccess()}>
                        <span>Connect MIDI</span>
                        <span className="ui-token-trigger-row-icon" aria-hidden="true">MIDI</span>
                    </button>
                ) : null}

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Input Device</span>
                    <NodeSelectField
                        value={midiData.inputId}
                        onChange={(value) => handleChange({ inputId: value as MidiCCNodeData['inputId'] })}
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
                        onChange={(value) => handleChange({
                            channel: value === 'all' ? 'all' : Number(value),
                        })}
                    >
                        <option value="all">All</option>
                        {Array.from({ length: 16 }, (_, index) => (
                            <option key={index + 1} value={index + 1}>{index + 1}</option>
                        ))}
                    </NodeSelectField>
                </div>

                <div className="node-shell__widget-field">
                    <span className="node-shell__widget-field-label">Controller</span>
                    <NodeNumberField min={0} max={127} step={1} value={midiData.cc} onChange={(value) => handleChange({ cc: value })} />
                </div>

                <button type="button" className={`node-shell__transport-button ${learning ? 'is-live' : ''}`} onClick={() => setLearning((value) => !value)}>
                    <span>{learning ? 'Waiting...' : 'Learn'}</span>
                </button>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <NodeValueBadge live={midiCC.lastEvent !== null}>{midiCC.normalized.toFixed(2)}</NodeValueBadge>
                    <NodeValueBadge>{String(midiCC.raw)}</NodeValueBadge>
                    {midiCC.source.name ? <NodeValueBadge>{midiCC.source.name}</NodeValueBadge> : null}
                </div>
            </NodeWidget>
        </NodeShell>
    );
});

MidiCCNode.displayName = 'MidiCCNode';
export default MidiCCNode;
