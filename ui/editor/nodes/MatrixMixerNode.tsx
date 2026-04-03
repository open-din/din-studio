import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
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
import { formatConnectedValue, useTargetHandleConnection } from '../paramConnections';
import { useAudioGraphStore } from '../store';
import type { MatrixMixerNodeData } from '../types';

const clampSize = (value: number) => Math.max(2, Math.min(8, Math.floor(value)));

function MatrixCellEditor({
    nodeId,
    row,
    column,
    value,
    onChange,
}: {
    nodeId: string;
    row: number;
    column: number;
    value: number;
    onChange: (next: number) => void;
}) {
    const handleId = `cell:${row}:${column}`;
    const connection = useTargetHandleConnection(nodeId, handleId);

    return connection.connected ? (
        <NodeValueBadge live>{formatConnectedValue(connection.value)}</NodeValueBadge>
    ) : (
        <NodeNumberField min={0} max={1} step={0.01} value={value} onChange={onChange} />
    );
}

function MatrixCellHandleRow({
    nodeId,
    row,
    column,
    value,
}: {
    nodeId: string;
    row: number;
    column: number;
    value: number;
}) {
    const handleId = `cell:${row}:${column}`;
    const connection = useTargetHandleConnection(nodeId, handleId);

    return (
        <NodeHandleRow
            direction="target"
            label={`M${row + 1}${column + 1}`}
            handleId={handleId}
            handleKind="control"
            control={
                <NodeValueBadge live={connection.connected}>
                    {connection.connected
                        ? formatConnectedValue(connection.value)
                        : value.toFixed(2)}
                </NodeValueBadge>
            }
        />
    );
}

const MatrixMixerNode = memo(({ id, data, selected }: NodeProps) => {
    const matrixData = data as MatrixMixerNodeData;
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);

    const inputs = clampSize(matrixData.inputs || 4);
    const outputs = clampSize(matrixData.outputs || 4);
    const matrix = Array.from({ length: inputs }, (_, row) =>
        Array.from({ length: outputs }, (_, column) => matrixData.matrix?.[row]?.[column] ?? (row === column ? 1 : 0))
    );

    const updateMatrix = (nextMatrix: number[][], nextInputs = inputs, nextOutputs = outputs) => {
        const payload = {
            matrix: nextMatrix,
            inputs: nextInputs,
            outputs: nextOutputs,
        };
        updateNodeData(id, payload);
        audioEngine.updateNode(id, payload);
    };

    const updateSize = (kind: 'inputs' | 'outputs', nextValue: number) => {
        const nextInputs = kind === 'inputs' ? clampSize(nextValue) : inputs;
        const nextOutputs = kind === 'outputs' ? clampSize(nextValue) : outputs;
        const nextMatrix = Array.from({ length: nextInputs }, (_, row) =>
            Array.from({ length: nextOutputs }, (_, column) => matrixData.matrix?.[row]?.[column] ?? (row === column ? 1 : 0))
        );
        updateMatrix(nextMatrix, nextInputs, nextOutputs);
    };

    const updateCell = (row: number, column: number, nextValue: number) => {
        const nextMatrix = matrix.map((rowValues, rowIndex) =>
            rowValues.map((cellValue, columnIndex) => (rowIndex === row && columnIndex === column ? nextValue : cellValue))
        );
        updateMatrix(nextMatrix);
    };

    return (
        <NodeShell
            nodeType="matrixMixer"
            title={matrixData.label?.trim() || 'Matrix Mixer'}
            selected={selected}
            badge={<NodeValueBadge>{`${inputs}x${outputs}`}</NodeValueBadge>}
        >
            <NodeHandleRow direction="source" label="out mix" handleId="out" handleKind="audio" />
            {Array.from({ length: outputs }, (_, index) => (
                <NodeHandleRow
                    key={`matrix-out-${index}`}
                    direction="source"
                    label={`out ${index + 1}`}
                    handleId={`out${index + 1}`}
                    handleKind="audio"
                />
            ))}

            <NodeWidget title={<NodeWidgetTitle icon="matrixMixer">Routing matrix</NodeWidgetTitle>}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <NodeSelectField value={String(inputs)} onChange={(value) => updateSize('inputs', Number(value))}>
                        {Array.from({ length: 7 }, (_, index) => index + 2).map((value) => (
                            <option key={`in-${value}`} value={value}>{value} inputs</option>
                        ))}
                    </NodeSelectField>
                    <NodeSelectField value={String(outputs)} onChange={(value) => updateSize('outputs', Number(value))}>
                        {Array.from({ length: 7 }, (_, index) => index + 2).map((value) => (
                            <option key={`out-${value}`} value={value}>{value} outputs</option>
                        ))}
                    </NodeSelectField>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    {matrix.map((rowValues, row) => (
                        <div key={`matrix-row-${row}`} style={{ display: 'grid', gridTemplateColumns: `64px repeat(${outputs}, minmax(64px, 1fr))`, gap: '8px', alignItems: 'center' }}>
                            <NodeValueBadge>{`In ${row + 1}`}</NodeValueBadge>
                            {rowValues.map((cell, column) => (
                                <MatrixCellEditor
                                    key={`matrix-cell-${row}-${column}`}
                                    nodeId={id}
                                    row={row}
                                    column={column}
                                    value={cell}
                                    onChange={(nextValue) => updateCell(row, column, nextValue)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </NodeWidget>

            {Array.from({ length: inputs }, (_, index) => (
                <NodeHandleRow
                    key={`matrix-in-${index}`}
                    direction="target"
                    label={`in ${index + 1}`}
                    handleId={`in${index + 1}`}
                    handleKind="audio"
                />
            ))}

            {matrix.flatMap((rowValues, row) =>
                rowValues.map((cell, column) => (
                    <MatrixCellHandleRow
                        key={`matrix-handle-${row}-${column}`}
                        nodeId={id}
                        row={row}
                        column={column}
                        value={cell}
                    />
                ))
            )}
        </NodeShell>
    );
});

MatrixMixerNode.displayName = 'MatrixMixerNode';
export default MatrixMixerNode;
