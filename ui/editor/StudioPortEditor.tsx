import React, { useCallback, useMemo, useState } from 'react';
import type { AudioNodeData } from './store';
import { getStudioNodeDefinition } from './nodeCatalog/catalog';
import type { StudioNodePortInterface, StudioNodePortSchema, StudioNodePortValueType } from './nodeCatalog/definition';
import { resolveStudioPortsForInstance } from './nodeCatalog/handles';
import { normalizeStudioNodeDefinition } from './nodeCatalog/normalize';
import { validateStudioNodeDefinition } from './nodeCatalog/validate';

const PORT_TYPES: StudioNodePortValueType[] = ['audio', 'trigger', 'int', 'float', 'bool', 'enum'];

function nextUniqueName(base: string, taken: Set<string>): string {
    let candidate = base;
    let i = 1;
    while (taken.has(candidate)) {
        candidate = `${base}${i}`;
        i += 1;
    }
    return candidate;
}

function defaultPort(kind: StudioNodePortValueType, side: 'inputs' | 'outputs'): StudioNodePortSchema {
    const ifaceInput = kind === 'bool' ? 'checkbox' : kind === 'audio' || kind === 'trigger' ? 'input' : 'slider';
    const base: StudioNodePortSchema = {
        type: kind,
        name: side === 'inputs' ? 'in' : 'out',
        interface: ifaceInput,
    };
    if (kind === 'int') {
        return { ...base, default: 0, min: 0, max: 127, step: 1 };
    }
    if (kind === 'float') {
        return { ...base, default: 0, min: 0, max: 1, step: 0.01 };
    }
    if (kind === 'enum') {
        return { ...base, interface: 'input', enumOptions: ['a', 'b'], enumDefault: 'a' };
    }
    return base;
}

function clonePorts(ports: StudioNodePortSchema[]): StudioNodePortSchema[] {
    return ports.map((p) => ({ ...p, enumOptions: p.enumOptions ? [...p.enumOptions] : undefined }));
}

interface StudioPortEditorProps {
    nodeId: string;
    nodeData: AudioNodeData;
    studioDef: NonNullable<ReturnType<typeof getStudioNodeDefinition>>;
    updateNodeData: (nodeId: string, data: Partial<AudioNodeData>) => void;
}

/**
 * Inspector section: edit catalog-backed input/output port lists when YAML enables
 * `editableInputsParams` / `editableOutputsParams`.
 */
export function StudioPortEditor({ nodeId, nodeData, studioDef, updateNodeData }: StudioPortEditorProps) {
    const [addKind, setAddKind] = useState<StudioNodePortValueType>('float');
    const [validationError, setValidationError] = useState<string | null>(null);

    const { inputs, outputs } = useMemo(
        () => resolveStudioPortsForInstance(nodeData, studioDef),
        [nodeData, studioDef],
    );

    const applyPorts = useCallback(
        (nextInputs: StudioNodePortSchema[] | undefined, nextOutputs: StudioNodePortSchema[] | undefined) => {
            const cur = resolveStudioPortsForInstance(nodeData, studioDef);
            const mergedInputs = nextInputs ?? cur.inputs;
            const mergedOutputs = nextOutputs ?? cur.outputs;
            const mergedDef = normalizeStudioNodeDefinition({
                ...studioDef,
                inputs: mergedInputs,
                outputs: mergedOutputs,
            });
            const v = validateStudioNodeDefinition(mergedDef);
            if (!v.ok) {
                setValidationError(v.errors[0] ?? 'Invalid port list');
                return;
            }
            setValidationError(null);
            const nextOverrides = { ...nodeData.studioPortOverrides };
            if (studioDef.editableInputsParams && nextInputs !== undefined) {
                nextOverrides.inputs = clonePorts(nextInputs);
            }
            if (studioDef.editableOutputsParams && nextOutputs !== undefined) {
                nextOverrides.outputs = clonePorts(nextOutputs);
            }
            updateNodeData(nodeId, { studioPortOverrides: nextOverrides });
        },
        [nodeData, nodeId, studioDef, updateNodeData],
    );

    const updatePortAt = (
        side: 'inputs' | 'outputs',
        index: number,
        patch: Partial<StudioNodePortSchema>,
    ) => {
        const list = side === 'inputs' ? inputs : outputs;
        const next = list.map((p, i) => (i === index ? { ...p, ...patch } : p));
        if (side === 'inputs') {
            applyPorts(next, undefined);
        } else {
            applyPorts(undefined, next);
        }
    };

    const removePortAt = (side: 'inputs' | 'outputs', index: number) => {
        const list = side === 'inputs' ? inputs : outputs;
        const next = list.filter((_, i) => i !== index);
        if (side === 'inputs') {
            applyPorts(next, undefined);
        } else {
            applyPorts(undefined, next);
        }
    };

    const addPort = (side: 'inputs' | 'outputs') => {
        const list = side === 'inputs' ? inputs : outputs;
        const taken = new Set(list.map((p) => p.name.trim()).filter(Boolean));
        const baseName = side === 'inputs' ? 'in' : 'out';
        const name = nextUniqueName(baseName, taken);
        const port = { ...defaultPort(addKind, side), name };
        const next = [...list, port];
        if (side === 'inputs') {
            applyPorts(next, undefined);
        } else {
            applyPorts(undefined, next);
        }
    };

    const renderPortRow = (side: 'inputs' | 'outputs', port: StudioNodePortSchema, index: number) => {
        const inputSignalOnly = side === 'inputs' && port.interface === 'input';
        const showNumericValueFields = (port.type === 'int' || port.type === 'float') && !inputSignalOnly;
        const showEnumDefault = port.type === 'enum' && !(side === 'inputs' && port.interface === 'input');

        return (
            <div
                key={`${side}-${port.name}-${index}`}
                className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)]/70 p-3"
            >
                <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                        {side === 'inputs' ? 'Input' : 'Output'} · {port.type}
                    </span>
                    <button
                        type="button"
                        onClick={() => removePortAt(side, index)}
                        className="rounded-full border border-[var(--panel-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
                    >
                        ×
                    </button>
                </div>
                <div className="space-y-2">
                    <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                        <span className="text-[11px] text-[var(--text)]">Name (handle id)</span>
                        <input
                            type="text"
                            value={port.name}
                            onChange={(e) => updatePortAt(side, index, { name: e.target.value.trim() })}
                            className="min-w-0 flex-1 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 font-mono text-[11px] text-[var(--text)]"
                        />
                    </label>
                    <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                        <span className="text-[11px] text-[var(--text)]">Type</span>
                        <select
                            value={port.type}
                            onChange={(e) => {
                                const t = e.target.value as StudioNodePortValueType;
                                const fresh = defaultPort(t, side);
                                updatePortAt(side, index, { ...fresh, name: port.name, label: port.label });
                            }}
                            className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[11px] text-[var(--text)]"
                        >
                            {PORT_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </label>
                    {side === 'inputs' && (port.type === 'int' || port.type === 'float' || port.type === 'enum') && (
                        <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                            <span className="text-[11px] text-[var(--text)]">Interface</span>
                            <select
                                value={port.interface === 'input' ? 'input' : 'slider'}
                                onChange={(e) => {
                                    const next: StudioNodePortInterface = e.target.value === 'input' ? 'input' : 'slider';
                                    updatePortAt(side, index, { interface: next });
                                }}
                                className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[11px] text-[var(--text)]"
                            >
                                <option value="slider">Slider / widget</option>
                                <option value="input">Signal only</option>
                            </select>
                        </label>
                    )}
                    {side === 'inputs' && port.type === 'bool' && (
                        <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                            <span className="text-[11px] text-[var(--text)]">Interface</span>
                            <select
                                value={port.interface}
                                onChange={(e) => {
                                    const next = e.target.value as StudioNodePortSchema['interface'];
                                    updatePortAt(side, index, { interface: next });
                                }}
                                className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[11px] text-[var(--text)]"
                            >
                                <option value="checkbox">Checkbox</option>
                                <option value="input">Signal only</option>
                            </select>
                        </label>
                    )}
                    {showNumericValueFields && (
                        <>
                            <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">Default</span>
                                <input
                                    type="number"
                                    value={port.default ?? 0}
                                    onChange={(e) => updatePortAt(side, index, { default: Number(e.target.value) })}
                                    className="w-24 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-right text-[11px]"
                                />
                            </label>
                            <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">Min</span>
                                <input
                                    type="number"
                                    value={port.min ?? 0}
                                    onChange={(e) => updatePortAt(side, index, { min: Number(e.target.value) })}
                                    className="w-24 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-right text-[11px]"
                                />
                            </label>
                            <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">Max</span>
                                <input
                                    type="number"
                                    value={port.max ?? 1}
                                    onChange={(e) => updatePortAt(side, index, { max: Number(e.target.value) })}
                                    className="w-24 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-right text-[11px]"
                                />
                            </label>
                            <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">Step</span>
                                <input
                                    type="number"
                                    value={port.step ?? (port.type === 'int' ? 1 : 0.01)}
                                    onChange={(e) => updatePortAt(side, index, { step: Number(e.target.value) })}
                                    className="w-24 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-right text-[11px]"
                                />
                            </label>
                        </>
                    )}
                    {port.type === 'enum' && (
                        <>
                            <label className="flex flex-col gap-1 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                <span className="text-[11px] text-[var(--text)]">Enum options (comma-separated)</span>
                                <input
                                    type="text"
                                    value={(port.enumOptions ?? []).join(', ')}
                                    onChange={(e) => {
                                        const opts = e.target.value
                                            .split(',')
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                        updatePortAt(side, index, { enumOptions: opts });
                                    }}
                                    className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[11px]"
                                />
                            </label>
                            {showEnumDefault && (
                                <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
                                    <span className="text-[11px] text-[var(--text)]">Default option</span>
                                    <input
                                        type="text"
                                        value={port.enumDefault ?? ''}
                                        onChange={(e) => updatePortAt(side, index, { enumDefault: e.target.value.trim() })}
                                        className="min-w-0 flex-1 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2 py-1 text-[11px]"
                                    />
                                </label>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    if (!studioDef.editableInputsParams && !studioDef.editableOutputsParams) {
        return null;
    }

    return (
        <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)]">
            <div className="border-b border-[var(--panel-border)] px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                    Ports (catalog)
                </div>
                <div className="mt-1 text-[10px] leading-4 text-[var(--text-subtle)]">
                    Editable inputs/outputs for this node instance. Handle ids match port names.
                </div>
                {validationError && (
                    <div className="mt-2 text-[10px] text-[var(--danger)]">{validationError}</div>
                )}
            </div>
            <div className="space-y-4 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)]/40 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                        New port type
                    </span>
                    <select
                        value={addKind}
                        onChange={(e) => setAddKind(e.target.value as StudioNodePortValueType)}
                        className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] px-2 py-1 text-[11px]"
                    >
                        {PORT_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                    {studioDef.editableInputsParams && (
                        <button
                            type="button"
                            onClick={() => addPort('inputs')}
                            className="rounded-lg border border-[var(--panel-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text)] hover:border-[var(--accent)]"
                        >
                            + Input
                        </button>
                    )}
                    {studioDef.editableOutputsParams && (
                        <button
                            type="button"
                            onClick={() => addPort('outputs')}
                            className="rounded-lg border border-[var(--panel-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text)] hover:border-[var(--accent)]"
                        >
                            + Output
                        </button>
                    )}
                </div>

                {studioDef.editableInputsParams && (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                            Inputs
                        </div>
                        {inputs.map((p, i) => renderPortRow('inputs', p, i))}
                    </div>
                )}
                {studioDef.editableOutputsParams && (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                            Outputs
                        </div>
                        {outputs.map((p, i) => renderPortRow('outputs', p, i))}
                    </div>
                )}
            </div>
        </section>
    );
}
