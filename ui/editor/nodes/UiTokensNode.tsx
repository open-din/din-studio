import { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { useAudioGraphStore } from '../store';
import {
    NodeHandleRow,
    NodeShell,
    NodeValueBadge,
    NodeWidget,
} from '../components/NodeShell';
import { getInputParamHandleId } from '../nodeHelpers';
import type { UiTokensNodeData } from '../types';
import { normalizeUiTokenParams } from '../uiTokens';

const UiTokensNode = memo(({ id, data, selected }: NodeProps<Node<UiTokensNodeData>>) => {
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);
    const uiTokensData = data;
    const params = normalizeUiTokenParams(uiTokensData.params);

    const triggerToken = (tokenId: string) => {
        const nextParams = params.map((param) =>
            param.id === tokenId ? { ...param, value: param.value + 1 } : param
        );
        updateNodeData(id, { params: nextParams });
    };

    return (
        <NodeShell
            nodeType="uiTokens"
            title={uiTokensData.label?.trim() || 'UI Tokens'}
            selected={selected}
            badge={params.length > 0 ? <NodeValueBadge>{`${params.length} outs`}</NodeValueBadge> : undefined}
        >
            {params.map((param, index) => (
                <NodeHandleRow
                    key={`${param.id}-${index}`}
                    direction="source"
                    label={param.label || param.name || `Token ${index + 1}`}
                    handleId={getInputParamHandleId(param)}
                    handleKind="control"
                />
            ))}

            {params.length > 0 ? (
                <NodeWidget title="Trigger Tokens">
                    {params.map((param) => (
                        <button
                            key={param.id}
                            type="button"
                            className="ui-token-trigger-row"
                            onClick={() => triggerToken(param.id)}
                            aria-label={`Trigger ${param.label || param.name || param.id}`}
                            data-testid={`ui-token-trigger-${param.id}`}
                        >
                            <span>{param.label || param.name || param.id}</span>
                            <span className="ui-token-trigger-row-icon" aria-hidden="true">+1</span>
                        </button>
                    ))}
                </NodeWidget>
            ) : null}
        </NodeShell>
    );
});

UiTokensNode.displayName = 'UiTokensNode';
export default UiTokensNode;
