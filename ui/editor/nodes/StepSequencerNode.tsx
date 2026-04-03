import React, { memo, useEffect, useState } from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { useAudioGraphStore, type StepSequencerNodeData } from '../store';
import { audioEngine } from '../AudioEngine';
import '../editor.css';
import {
    NodeHandleRow,
    NodeSelectField,
    NodeShell,
    NodeValueBadge,
    NodeWidget,
    NodeWidgetTitle,
} from '../components/NodeShell';

export const StepSequencerNode: React.FC<NodeProps<Node<StepSequencerNodeData>>> = memo(({ id, data, selected }) => {
    const updateNodeData = useAudioGraphStore((s) => s.updateNodeData);
    const [currentStep, setCurrentStep] = useState<number>(-1);

    useEffect(() => {
        return audioEngine.subscribeStep((step) => {
            setCurrentStep(step);
        });
    }, []);

    // Ensure arrays exist
    const steps = data.steps || 16;
    const velocities = data.pattern || Array(steps).fill(0.8);
    const activeSteps = data.activeSteps || Array(steps).fill(false);
    const playingStep = currentStep >= 0 ? currentStep % steps : -1;
    const shellWidth = Math.min(1000, Math.max(460, 148 + steps * 32));
    const toggleStep = (index: number) => {
        const newActive = [...activeSteps];
        newActive[index] = !newActive[index];
        updateNodeData(id, { activeSteps: newActive });
    };

    const updateVelocity = (index: number, value: number) => {
        const newVelocities = [...velocities];
        newVelocities[index] = value;
        updateNodeData(id, { pattern: newVelocities });
    };

    const updateSteps = (nextSteps: number) => {
        const clampedSteps = Math.max(1, nextSteps);
        const nextPattern = Array.from(
            { length: clampedSteps },
            (_, index) => velocities[index] ?? 0.8
        );
        const nextActiveSteps = Array.from(
            { length: clampedSteps },
            (_, index) => activeSteps[index] ?? false
        );
        updateNodeData(id, {
            steps: clampedSteps,
            pattern: nextPattern,
            activeSteps: nextActiveSteps,
        });
    };

    return (
        <NodeShell
            nodeType="stepSequencer"
            title={data.label?.trim() || 'Step Sequencer'}
            selected={selected}
            badge={<NodeValueBadge>pattern</NodeValueBadge>}
            className="sequencer-node"
            style={{ width: `${shellWidth}px`, minWidth: `${shellWidth}px` }}
        >
            <NodeHandleRow direction="source" label="trigger" handleId="trigger" handleKind="trigger" />

            <NodeWidget
                title={(
                    <>
                        <NodeWidgetTitle icon="stepSequencer">Pattern + velocity</NodeWidgetTitle>
                        <NodeSelectField
                            aria-label="Steps"
                            className="sequencer-size-select"
                            value={String(steps)}
                            onChange={(value) => updateSteps(Number(value))}
                        >
                            {[16, 32, 64].map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </NodeSelectField>
                    </>
                )}
                footer={<NodeValueBadge live={playingStep >= 0}>{playingStep >= 0 ? `step ${playingStep + 1} / ${steps}` : 'waiting'}</NodeValueBadge>}
            >
                <div className="sequencer-steps-row">
                    {Array.from({ length: steps }).map((_, index) => (
                        <div
                            key={`step-${index}`}
                            className={`step-column ${playingStep === index ? 'current-step-column' : ''} ${activeSteps[index] ? 'active-step-column' : ''}`}
                        >
                            <button
                                type="button"
                                className={`sequencer-pad ${activeSteps[index] ? 'active' : ''} ${playingStep === index ? 'current-step' : ''}`}
                                onClick={() => toggleStep(index)}
                                title={`Step ${index + 1}`}
                            />
                            <div className="velocity-bar-container">
                                <div
                                    className="velocity-bar"
                                    style={{ height: `${velocities[index] * 100}%` }}
                                />
                                <input
                                    type="range"
                                    className="velocity-input"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={velocities[index]}
                                    onChange={(event) => updateVelocity(index, Number(event.target.value))}
                                    title={`Velocity ${index + 1}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </NodeWidget>

            <NodeHandleRow
                direction="target"
                label="transport"
                handleId="transport"
                handleKind="trigger"
                control={<NodeValueBadge live={playingStep >= 0}>{playingStep >= 0 ? 'external' : 'idle'}</NodeValueBadge>}
            />
        </NodeShell>
    );
});
