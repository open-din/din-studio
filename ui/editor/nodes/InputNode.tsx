import { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { NodeHandleRow, NodeShell, NodeValueBadge } from '../components/NodeShell';
import { getInputParamHandleId } from '../nodeHelpers';
import type { InputNodeData } from '../types';

const InputNode = memo(({ data, selected }: NodeProps<Node<InputNodeData>>) => {
    const inputData = data;

    return (
        <NodeShell
            nodeType="input"
            title={inputData.label?.trim() || 'Input'}
            selected={selected}
            badge={inputData.params.length > 0 ? <NodeValueBadge>{`${inputData.params.length} outs`}</NodeValueBadge> : undefined}
        >
            {inputData.params.map((param, index) => (
                <NodeHandleRow
                    key={`${param.id}-${index}`}
                    direction="source"
                    label={param.label || param.name}
                    handleId={getInputParamHandleId(param)}
                    handleKind={param.socketKind ?? 'control'}
                />
            ))}
        </NodeShell>
    );
});

InputNode.displayName = 'InputNode';
export default InputNode;
