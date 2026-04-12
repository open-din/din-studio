import React, { useMemo, useState } from 'react';
import {
    useAudioGraphStore,
    type AudioNodeData,
    type InputNodeData,
    type InputParam,
    type InputParamValueKind,
    type OutputNodeData,
    type OutputParam,
    type UiTokensNodeData,
} from './store';
import { INPUT_PARAM_KINDS_INPUT_NODE, INPUT_PARAM_NUMERIC_KINDS } from './types';
import { audioEngine } from './AudioEngine';
import { ensureInputParam } from './nodeHelpers';
import { getInputParamHandleId } from './handleIds';
import {
    NodeCheckboxField,
    NodeNumberField,
    NodeSelectField,
    NodeTextField,
} from './components/NodeShell';
import { CodeGenerator } from './CodeGenerator';
import { formatConnectedValue, useTargetHandleConnection } from './paramConnections';
import {
    getInspectablePrimitiveEntries,
    getNodeDisplayLabel,
    getNodeInlineControls,
    getNodeInspectorSections,
    getNodeUiSchema,
    isTokenParamNode,
    type NodeInspectorField,
    type NodeInspectorSection,
    type NodeHandleRole,
} from './nodeUiRegistry';
import { UI_TOKEN_IDS, createUiTokenParam } from './uiTokens';
import { getStudioNodeDefinition } from './nodeCatalog/catalog';
import { StudioPortEditor } from './StudioPortEditor';

interface InspectorRowProps {
    nodeId: string;
    nodeData: AudioNodeData;
    field: NodeInspectorField;
    updateNodeData: (nodeId: string, data: Partial<AudioNodeData>) => void;
}

interface PrimitiveRowsProps {
    nodeId: string;
    updateNodeData: (nodeId: string, data: Partial<AudioNodeData>) => void;
    entries: Array<{ key: string; value: string | number | boolean | null | undefined }>;
}

function getStableId(prefix: string) {
    return `${prefix}-${typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function isPrimitiveValue(value: unknown): value is string | number | boolean | null | undefined {
    return typeof value === 'string'
        || typeof value === 'number'
        || typeof value === 'boolean'
        || value === null
        || value === undefined;
}

function nodeDataValue(nodeData: AudioNodeData, key: string): unknown {
    return (nodeData as Record<string, unknown>)[key];
}

function updateNodeField(
    updateNodeData: (nodeId: string, data: Partial<AudioNodeData>) => void,
    nodeId: string,
    key: string,
    value: unknown
) {
    updateNodeData(nodeId, { [key]: value } as Partial<AudioNodeData>);
}

function InspectorRow({ nodeId, nodeData, field, updateNodeData }: InspectorRowProps) {
    const handleId = field.kind === 'params' ? undefined : field.handleId;
    const targetHandle = handleId && (field.kind === 'number' || field.kind === 'range') ? handleId : '';
    const targetHandleInfo = useTargetHandleConnection(nodeId, targetHandle);

    const value = nodeDataValue(nodeData, field.key);
    const isConnectedTarget = Boolean(handleId && targetHandleInfo.connected && (field.kind === 'number' || field.kind === 'range'));

    return (
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)]/70 p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                        {field.label}
                    </div>
                    {field.description && (
                        <div className="mt-1 text-[10px] leading-4 text-[var(--text-subtle)]">
                            {field.description}
                        </div>
                    )}
                </div>
                {handleId && (
                    <span className="rounded-full border border-[var(--panel-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-subtle)]">
                        {handleId}
                    </span>
                )}
            </div>

            {field.kind === 'checkbox' && (
                <div className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                    <span className="text-[11px] text-[var(--text)]">{field.label}</span>
                    <NodeCheckboxField
                        checked={Boolean(value)}
                        onChange={(checked) => updateNodeField(updateNodeData, nodeId, field.key, checked)}
                        className="!m-0 shrink-0 border-0 bg-transparent p-0"
                    />
                </div>
            )}

            {field.kind === 'select' && (
                <div className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                    <span className="text-[11px] text-[var(--text)]">{field.label}</span>
                    <NodeSelectField
                        value={typeof value === 'string' ? value : field.options[0]?.value ?? ''}
                        onChange={(v) => updateNodeField(updateNodeData, nodeId, field.key, v)}
                        className="min-w-0 flex-1"
                        aria-label={field.label}
                    >
                        {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </NodeSelectField>
                </div>
            )}

            {field.kind === 'text' && (
                <label className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                    <span className="text-[11px] text-[var(--text)]">{field.label}</span>
                    <input
                        type="text"
                        value={typeof value === 'string' ? value : ''}
                        placeholder={field.placeholder}
                        onChange={(event) => updateNodeField(updateNodeData, nodeId, field.key, event.target.value)}
                        className="min-w-0 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[11px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:border-[var(--accent)] focus:outline-none"
                    />
                </label>
            )}

            {field.kind === 'number' && (
                <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                    <span className="text-[11px] text-[var(--text)]">{field.label}</span>
                    {isConnectedTarget ? (
                        <span className="rounded-full border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--accent)]">
                            Connected {formatConnectedValue(targetHandleInfo.value)}
                        </span>
                    ) : (
                        <NodeNumberField
                            value={typeof value === 'number' ? value : 0}
                            min={field.min}
                            max={field.max}
                            step={field.step ?? 0.01}
                            onChange={(v) => updateNodeField(updateNodeData, nodeId, field.key, v)}
                            className="min-w-0 flex-1"
                            aria-label={field.label}
                        />
                    )}
                </div>
            )}

            {field.kind === 'range' && (
                <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-[var(--text)]">{field.label}</span>
                        {isConnectedTarget ? (
                            <span className="rounded-full border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--accent)]">
                                Connected {formatConnectedValue(targetHandleInfo.value, field.displayValue)}
                            </span>
                        ) : null}
                    </div>
                    {isConnectedTarget ? (
                        <div className="rounded-lg border border-dashed border-[var(--panel-border)] px-3 py-2 text-[10px] text-[var(--text-subtle)]">
                            Slider hidden while the handle is connected.
                        </div>
                    ) : (
                        <NodeNumberField
                            value={typeof value === 'number' ? value : field.min}
                            min={field.min}
                            max={field.max}
                            step={field.step ?? 0.01}
                            onChange={(v) => updateNodeField(updateNodeData, nodeId, field.key, v)}
                            className="w-full"
                            aria-label={field.label}
                        />
                    )}
                </div>
            )}

            {field.kind === 'params' && (
                <div className="rounded-xl border border-dashed border-[var(--panel-border)] px-3 py-2 text-[10px] text-[var(--text-subtle)]">
                    {field.description ?? 'Parameters are managed inline in the node and exposed here for workspace-level editing.'}
                </div>
            )}
        </div>
    );
}

function PrimitiveRows({ nodeId, updateNodeData, entries }: PrimitiveRowsProps) {
    if (entries.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-[var(--panel-border)] px-3 py-4 text-[10px] text-[var(--text-subtle)]">
                No additional primitive properties are available for this node.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {entries.map((entry) => {
                const rawValue = entry.value;
                const label = entry.key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
                return (
                    <div key={entry.key} className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)]/70 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                                {label}
                            </span>
                            <span className="rounded-full border border-[var(--panel-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-subtle)]">
                                {entry.key}
                            </span>
                        </div>
                        {typeof rawValue === 'boolean' ? (
                            <div className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">{label}</span>
                                <NodeCheckboxField
                                    checked={rawValue}
                                    onChange={(checked) => updateNodeField(updateNodeData, nodeId, entry.key, checked)}
                                    className="!m-0 shrink-0 border-0 bg-transparent p-0"
                                />
                            </div>
                        ) : typeof rawValue === 'number' ? (
                            <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">{label}</span>
                                <NodeNumberField
                                    value={rawValue}
                                    onChange={(v) => updateNodeField(updateNodeData, nodeId, entry.key, v)}
                                    step={0.01}
                                    className="min-w-0 flex-1"
                                    aria-label={label}
                                />
                            </div>
                        ) : (
                            <div className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">{label}</span>
                                <NodeTextField
                                    value={typeof rawValue === 'string' ? rawValue : ''}
                                    onChange={(v) => updateNodeField(updateNodeData, nodeId, entry.key, v)}
                                    className="min-w-0 flex-1"
                                    aria-label={label}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function InspectorSectionView({
    section,
    nodeId,
    nodeData,
    updateNodeData,
    collapsed,
    onToggle,
}: {
    section: NodeInspectorSection;
    nodeId: string;
    nodeData: AudioNodeData;
    updateNodeData: (nodeId: string, data: Partial<AudioNodeData>) => void;
    collapsed: boolean;
    onToggle: () => void;
}) {
    const handledKeys = section.fields.map((field) => field.key);
    const primitiveEntries = getInspectablePrimitiveEntries(nodeData, handledKeys);

    return (
        <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)]">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={!collapsed}
            >
                <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                        {section.title}
                    </div>
                    {section.description && (
                        <div className="mt-1 text-[10px] leading-4 text-[var(--text-subtle)]">
                            {section.description}
                        </div>
                    )}
                </div>
                <span className="rounded-full border border-[var(--panel-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-subtle)]">
                    {collapsed ? 'Open' : 'Close'}
                </span>
            </button>
            {!collapsed && (
                <div className="border-t border-[var(--panel-border)] px-4 py-4">
                    <div className="space-y-3">
                        {section.fields.map((field) => (
                            <InspectorRow
                                key={field.key}
                                nodeId={nodeId}
                                nodeData={nodeData}
                                field={field}
                                updateNodeData={updateNodeData}
                            />
                        ))}
                    </div>
                    {primitiveEntries.length > 0 && (
                        <div className="mt-4">
                            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                                Advanced
                            </div>
                            <PrimitiveRows
                                nodeId={nodeId}
                                updateNodeData={updateNodeData}
                                entries={primitiveEntries}
                            />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function buildNewParamDraft(
    kind: InputParamValueKind,
    nodeId: string,
    nextIndex: number,
    isUiTokensNode: boolean,
): InputParam {
    const label = `Param ${nextIndex + 1}`;
    const id = getStableId('param');
    if (kind === 'float') {
        return ensureInputParam(
            {
                id,
                name: label,
                label,
                type: 'float',
                defaultValue: 0,
                value: 0,
                min: 0,
                max: isUiTokensNode ? 9999 : 1,
                step: 0.01,
            },
            nodeId,
            nextIndex,
        );
    }
    if (kind === 'int') {
        return ensureInputParam(
            {
                id,
                name: label,
                label,
                type: 'int',
                defaultValue: 0,
                value: 0,
                min: 0,
                max: 127,
                step: 1,
            },
            nodeId,
            nextIndex,
        );
    }
    if (kind === 'range') {
        return ensureInputParam(
            {
                id,
                name: label,
                label,
                type: 'range',
                defaultValue: 0.5,
                value: 0.5,
                min: 0,
                max: 1,
                step: 0.01,
            },
            nodeId,
            nextIndex,
        );
    }
    if (kind === 'audio') {
        return ensureInputParam({ id, name: label, label, type: 'audio', audioSource: 'none' }, nodeId, nextIndex);
    }
    return ensureInputParam(
        {
            id,
            name: label,
            label,
            type: kind,
            defaultValue: 0,
            value: 0,
            min: 0,
            max: 1,
        },
        nodeId,
        nextIndex,
    );
}

function TokenParamEditor({
    nodeId,
    nodeData,
    updateNodeData,
}: {
    nodeId: string;
    nodeData: InputNodeData | UiTokensNodeData;
    updateNodeData: (nodeId: string, data: Partial<AudioNodeData>) => void;
}) {
    const [addKind, setAddKind] = useState<InputParamValueKind>('float');
    const [presetTokenId, setPresetTokenId] = useState<(typeof UI_TOKEN_IDS)[number] | ''>('');

    const params = nodeData.params ?? [];
    const isUiTokensNode = nodeData.type === 'uiTokens';

    const addKindOptions: InputParamValueKind[] = isUiTokensNode
        ? [...INPUT_PARAM_NUMERIC_KINDS]
        : [...INPUT_PARAM_KINDS_INPUT_NODE];

    const handleAddParam = () => {
        if (isUiTokensNode && presetTokenId) {
            const tokenParam = createUiTokenParam(presetTokenId);
            updateNodeData(nodeId, { params: [...params, ensureInputParam(tokenParam, nodeId, params.length)] });
            setPresetTokenId('');
            return;
        }
        const next = buildNewParamDraft(addKind, nodeId, params.length, isUiTokensNode);
        updateNodeData(nodeId, { params: [...params, next] });
    };

    const handleUpdateParam = (index: number, updates: Partial<InputParam>) => {
        const nextParams = [...params];
        const merged = { ...nextParams[index], ...updates };
        nextParams[index] = ensureInputParam(merged, nodeId, index);
        updateNodeData(nodeId, { params: nextParams });
    };

    const handleChangeParamKind = (index: number, kind: InputParamValueKind) => {
        if (isUiTokensNode && !INPUT_PARAM_NUMERIC_KINDS.includes(kind)) return;
        const cur = params[index];
        const next = buildNewParamDraft(kind, nodeId, index, isUiTokensNode);
        next.id = cur.id;
        next.label = cur.label ?? cur.name;
        next.name = cur.name;
        const nextParams = [...params];
        nextParams[index] = ensureInputParam(next, nodeId, index);
        updateNodeData(nodeId, { params: nextParams });
    };

    const handleRemoveParam = (index: number) => {
        const nextParams = [...params];
        nextParams.splice(index, 1);
        updateNodeData(nodeId, { params: nextParams.map((p, i) => ensureInputParam(p, nodeId, i)) });
    };

    const numericKind = (t: InputParamValueKind) => t === 'float' || t === 'int' || t === 'range';

    return (
        <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)]">
            <div className="border-b border-[var(--panel-border)] px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                    {isUiTokensNode ? 'Tokens' : 'Params'}
                </div>
                <div className="mt-1 text-[10px] leading-4 text-[var(--text-subtle)]">
                    {isUiTokensNode
                        ? 'UI tokens are numeric sources intended for product chrome, theming, and feedback.'
                        : 'Parameters are exposed as stable handles and can be edited individually.'}
                </div>
            </div>

            <div className="space-y-3 px-4 py-4">
                {params.map((param, index) => (
                    <div key={`${param.id}-${index}`} className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)]/70 p-3">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                                    {param.type}
                                </div>
                                <div className="mt-1 font-mono text-[10px] text-[var(--text-subtle)]">
                                    {getInputParamHandleId(param)}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveParam(index)}
                                className="rounded-full border border-[var(--panel-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">Param id</span>
                                <NodeTextField
                                    value={param.id}
                                    onChange={(v) => handleUpdateParam(index, { id: v.trim() })}
                                    className="min-w-0 flex-1 font-mono text-[11px]"
                                    aria-label="Param id"
                                />
                            </div>
                            {!isUiTokensNode && (
                                <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                    <span className="text-[11px] text-[var(--text)]">Kind</span>
                                    <NodeSelectField
                                        value={param.type}
                                        onChange={(v) => handleChangeParamKind(index, v as InputParamValueKind)}
                                        className="min-w-0 flex-1"
                                        aria-label="Parameter kind"
                                    >
                                        {INPUT_PARAM_KINDS_INPUT_NODE.map((k) => (
                                            <option key={k} value={k}>
                                                {k}
                                            </option>
                                        ))}
                                    </NodeSelectField>
                                </div>
                            )}
                            {isUiTokensNode && (
                                <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                    <span className="text-[11px] text-[var(--text)]">Kind</span>
                                    <NodeSelectField
                                        value={param.type}
                                        onChange={(v) => handleChangeParamKind(index, v as InputParamValueKind)}
                                        className="min-w-0 flex-1"
                                        aria-label="Token kind"
                                    >
                                        {INPUT_PARAM_NUMERIC_KINDS.map((k) => (
                                            <option key={k} value={k}>
                                                {k}
                                            </option>
                                        ))}
                                    </NodeSelectField>
                                </div>
                            )}
                            <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">Label</span>
                                <NodeTextField
                                    value={param.label || param.name}
                                    onChange={(v) => handleUpdateParam(index, { label: v, name: v })}
                                    className="min-w-0 flex-1 text-[11px]"
                                    aria-label="Label"
                                />
                            </div>

                            {param.type === 'audio' && (
                                <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                    <span className="text-[11px] text-[var(--text)]">Audio source</span>
                                    <NodeSelectField
                                        value={param.audioSource ?? 'none'}
                                        onChange={(v) => handleUpdateParam(index, { audioSource: v as InputParam['audioSource'] })}
                                        className="min-w-0 flex-1"
                                        aria-label="Audio source"
                                    >
                                        <option value="none">None</option>
                                        <option value="mic">Microphone</option>
                                        <option value="file">Audio file</option>
                                    </NodeSelectField>
                                </div>
                            )}

                            {numericKind(param.type) && (
                                <>
                                    <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                        <span className="text-[11px] text-[var(--text)]">Default</span>
                                        <NodeNumberField
                                            value={param.defaultValue}
                                            {...(param.type === 'range'
                                                ? { min: param.min, max: param.max }
                                                : param.type === 'int'
                                                    ? { min: param.min, max: param.max }
                                                    : {})}
                                            step={param.step ?? (param.type === 'int' ? 1 : 0.01)}
                                            onChange={(v) => handleUpdateParam(index, { defaultValue: v, value: v })}
                                            className="min-w-0 flex-1"
                                            aria-label="Default"
                                        />
                                    </div>
                                    {(param.type === 'int' || param.type === 'range') && (
                                        <>
                                            <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                                <span className="text-[11px] text-[var(--text)]">Min</span>
                                                <NodeNumberField
                                                    value={param.min}
                                                    step={param.type === 'int' ? 1 : param.step ?? 0.01}
                                                    onChange={(v) => handleUpdateParam(index, { min: v })}
                                                    className="min-w-0 flex-1"
                                                    aria-label="Min"
                                                />
                                            </div>
                                            <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                                <span className="text-[11px] text-[var(--text)]">Max</span>
                                                <NodeNumberField
                                                    value={param.max}
                                                    step={param.type === 'int' ? 1 : param.step ?? 0.01}
                                                    onChange={(v) => handleUpdateParam(index, { max: v })}
                                                    className="min-w-0 flex-1"
                                                    aria-label="Max"
                                                />
                                            </div>
                                        </>
                                    )}
                                    {param.type === 'range' && (
                                        <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                            <span className="text-[11px] text-[var(--text)]">Step</span>
                                            <NodeNumberField
                                                value={param.step ?? 0.01}
                                                min={0.0001}
                                                max={1}
                                                step={0.001}
                                                onChange={(v) => handleUpdateParam(index, { step: v })}
                                                className="min-w-0 flex-1"
                                                aria-label="Step"
                                            />
                                        </div>
                                    )}
                                    <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                        <div className="mb-2 text-[11px] text-[var(--text)]">Current</div>
                                        <NodeNumberField
                                            value={param.value}
                                            {...(param.type === 'range' || param.type === 'int'
                                                ? { min: param.min, max: param.max }
                                                : {})}
                                            step={param.step ?? (param.type === 'int' ? 1 : 0.01)}
                                            onChange={(v) => handleUpdateParam(index, { value: v })}
                                            className="w-full"
                                            aria-label="Current value"
                                        />
                                    </div>
                                </>
                            )}

                            {(param.type === 'trigger' || param.type === 'event') && (
                                <button
                                    type="button"
                                    onClick={() => audioEngine.pulsePatchInputParam(nodeId, getInputParamHandleId(param))}
                                    className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                >
                                    Fire
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <div className="rounded-2xl border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)]/40 p-3">
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                        Add parameter
                    </div>
                    {isUiTokensNode && (
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-[var(--text-subtle)]">Preset token</span>
                            <NodeSelectField
                                value={presetTokenId}
                                onChange={(v) => setPresetTokenId(v as (typeof UI_TOKEN_IDS)[number] | '')}
                                className="min-w-[10rem]"
                                aria-label="Preset token"
                            >
                                <option value="">—</option>
                                {UI_TOKEN_IDS.map((id) => (
                                    <option key={id} value={id}>
                                        {id}
                                    </option>
                                ))}
                            </NodeSelectField>
                            <button
                                type="button"
                                onClick={() => presetTokenId && handleAddParam()}
                                disabled={!presetTokenId}
                                className="rounded-lg border border-[var(--panel-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text)] disabled:opacity-40 hover:border-[var(--accent)]"
                            >
                                Add preset
                            </button>
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <NodeSelectField
                            value={addKind}
                            onChange={(v) => setAddKind(v as InputParamValueKind)}
                            className="min-w-[8rem]"
                            aria-label="New parameter kind"
                        >
                            {addKindOptions.map((k) => (
                                <option key={k} value={k}>
                                    {k}
                                </option>
                            ))}
                        </NodeSelectField>
                        <button
                            type="button"
                            onClick={handleAddParam}
                            className="h-10 rounded-xl border border-[var(--panel-border)] px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function OutputParamEditor({
    nodeId,
    nodeData,
    updateNodeData,
}: {
    nodeId: string;
    nodeData: OutputNodeData;
    updateNodeData: (nodeId: string, data: Partial<AudioNodeData>) => void;
}) {
    const [newParamName, setNewParamName] = useState('');
    const params = nodeData.outputParams ?? [];

    const handleAddParam = () => {
        const trimmedName = newParamName.trim();
        if (!trimmedName) return;
        const newParam: OutputParam = {
            id: getStableId('out-param'),
            name: trimmedName,
            label: trimmedName,
            socketKind: 'audio',
        };
        updateNodeData(nodeId, { outputParams: [...params, newParam] });
        setNewParamName('');
    };

    const handleUpdateParam = (index: number, updates: Partial<OutputParam>) => {
        const next = [...params];
        next[index] = { ...next[index], ...updates };
        updateNodeData(nodeId, { outputParams: next });
    };

    const handleRemoveParam = (index: number) => {
        const next = [...params];
        next.splice(index, 1);
        updateNodeData(nodeId, { outputParams: next });
    };

    return (
        <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)]">
            <div className="border-b border-[var(--panel-border)] px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                    Outputs
                </div>
                <div className="mt-1 text-[10px] leading-4 text-[var(--text-subtle)]">
                    Output handles exposed by this node for nested patch connections.
                </div>
            </div>

            <div className="space-y-3 px-4 py-4">
                {params.map((param, index) => (
                    <div key={param.id} className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)]/70 p-3">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                                    Output
                                </div>
                                <div className="mt-1 font-mono text-[10px] text-[var(--text-subtle)]">
                                    {param.id}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveParam(index)}
                                className="rounded-full border border-[var(--panel-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-3">
                            <label className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">Label</span>
                                <input
                                    type="text"
                                    value={param.label || param.name}
                                    onChange={(event) => handleUpdateParam(index, { label: event.target.value, name: event.target.value })}
                                    className="min-w-0 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[11px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                                />
                            </label>
                            <label className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">Socket</span>
                                <select
                                    value={param.socketKind}
                                    onChange={(event) => handleUpdateParam(index, { socketKind: event.target.value as 'audio' | 'control' | 'trigger' })}
                                    className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[11px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                                >
                                    <option value="audio">audio</option>
                                    <option value="control">control</option>
                                    <option value="trigger">trigger</option>
                                </select>
                            </label>
                        </div>
                    </div>
                ))}

                <div className="rounded-2xl border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)]/40 p-3">
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                        Add Output
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="New output name..."
                            value={newParamName}
                            onChange={(event) => setNewParamName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') handleAddParam();
                            }}
                            className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 text-[11px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:border-[var(--accent)] focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={handleAddParam}
                            className="h-10 rounded-xl border border-[var(--panel-border)] px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

const Inspector: React.FC = () => {
    const nodes = useAudioGraphStore((state) => state.nodes);
    const selectedNodeId = useAudioGraphStore((state) => state.selectedNodeId);
    const updateNodeData = useAudioGraphStore((state) => state.updateNodeData);

    const selectedNode = nodes.find((node) => node.id === selectedNodeId);
    const nodeData = selectedNode?.data as AudioNodeData | undefined;
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const schema = useMemo(() => (nodeData ? getNodeUiSchema(nodeData.type) : null), [nodeData]);
    const studioCatalogDef = useMemo(() => (nodeData ? getStudioNodeDefinition(nodeData.type) : undefined), [nodeData]);
    const nodeLabel = nodeData ? (nodeData.label?.trim() || schema?.label || getNodeDisplayLabel(nodeData.type)) : '';
    const inlineControls = nodeData ? getNodeInlineControls(nodeData.type) : [];
    const sections = nodeData ? getNodeInspectorSections(nodeData.type) : [];

    if (!selectedNode || !nodeData) {
        return <CodeGenerator />;
    }

    const handleToggleSection = (sectionId: string) => {
        setCollapsedSections((current) => ({
            ...current,
            [sectionId]: !current[sectionId],
        }));
    };

    const handleRoles = schema?.handleRoles ?? {};
    const handleRoleEntries = Object.entries(handleRoles) as Array<[string, NodeHandleRole]>;

    const extraPrimitiveEntries = getInspectablePrimitiveEntries(
        nodeData,
        [
            ...inlineControls,
            ...sections.flatMap((section) => section.fields.map((field) => field.key)),
        ]
    );

    const isTokenNode = isTokenParamNode(nodeData);
    const showStudioPortEditor =
        studioCatalogDef
        && (studioCatalogDef.editableInputsParams || studioCatalogDef.editableOutputsParams);

    return (
        <div className="flex h-full flex-col bg-[var(--panel-bg)] text-[11px] text-[var(--text)]">
            <div className="border-b border-[var(--panel-border)] bg-[var(--panel-muted)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-semibold text-[var(--text)]">
                            {nodeLabel}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                            <span>{nodeData.type}</span>
                            <span className="rounded-full border border-[var(--panel-border)] px-2 py-0.5 font-mono normal-case tracking-normal">
                                {selectedNode.id}
                            </span>
                        </div>
                    </div>
                    {schema && (
                        <span className="rounded-full border border-[var(--panel-border)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                            {sections.length} sections
                        </span>
                    )}
                </div>

                {handleRoleEntries.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {handleRoleEntries.map(([handleId, role]) => (
                            <span
                                key={handleId}
                                className="rounded-full border border-[var(--panel-border)] bg-[var(--panel-bg)] px-2 py-1 text-[10px] font-mono text-[var(--text-subtle)]"
                            >
                                {handleId} · {role}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {showStudioPortEditor && studioCatalogDef && (
                    <StudioPortEditor
                        nodeId={selectedNode.id}
                        nodeData={nodeData}
                        studioDef={studioCatalogDef}
                        updateNodeData={updateNodeData}
                    />
                )}
                {isTokenNode && (
                    <TokenParamEditor
                        nodeId={selectedNode.id}
                        nodeData={nodeData as InputNodeData | UiTokensNodeData}
                        updateNodeData={updateNodeData}
                    />
                )}

                {nodeData.type === 'output' && (
                    <OutputParamEditor
                        nodeId={selectedNode.id}
                        nodeData={nodeData as OutputNodeData}
                        updateNodeData={updateNodeData}
                    />
                )}

                {sections.map((section) => (
                    <InspectorSectionView
                        key={section.id}
                        section={section}
                        nodeId={selectedNode.id}
                        nodeData={nodeData}
                        updateNodeData={updateNodeData}
                        collapsed={Boolean(collapsedSections[section.id])}
                        onToggle={() => handleToggleSection(section.id)}
                    />
                ))}

                {extraPrimitiveEntries.length > 0 && !isTokenNode && sections.length === 0 && (
                    <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)]">
                        <div className="border-b border-[var(--panel-border)] px-4 py-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                                Advanced
                            </div>
                            <div className="mt-1 text-[10px] leading-4 text-[var(--text-subtle)]">
                                Primitive node fields that are not yet part of the schema remain editable here.
                            </div>
                        </div>
                        <div className="px-4 py-4">
                            <PrimitiveRows
                                nodeId={selectedNode.id}
                                updateNodeData={updateNodeData}
                                entries={extraPrimitiveEntries.filter((entry) => isPrimitiveValue(entry.value))}
                            />
                        </div>
                    </section>
                )}

                {sections.length === 0 && extraPrimitiveEntries.length === 0 && !isTokenNode && (
                    <div className="rounded-2xl border border-dashed border-[var(--panel-border)] px-4 py-4 text-[10px] text-[var(--text-subtle)]">
                        No inspector schema is registered for this node yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inspector;
