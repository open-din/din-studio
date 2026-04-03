import type { CSSProperties, ChangeEvent, InputHTMLAttributes, KeyboardEvent, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Position } from '@xyflow/react';
import type { EditorNodeType, PaletteCategory } from '../nodeCatalog';
import { getNodeCatalogEntry } from '../nodeCatalog';
import { CustomHandle } from './CustomHandle';
import { EditorIcon } from './EditorIcons';

type NodeCategoryLabel = PaletteCategory | 'MIDI';
export type NodeHandleKind = 'audio' | 'control' | 'trigger';

const CATEGORY_LABELS: Record<NodeCategoryLabel, string> = {
    Sources: 'SOURCE',
    Effects: 'EFFECT',
    Routing: 'ROUTING',
    Math: 'MATH',
    MIDI: 'MIDI',
};

const CATEGORY_OVERRIDES: Partial<Record<EditorNodeType, NodeCategoryLabel>> = {
    stepSequencer: 'MIDI',
    pianoRoll: 'MIDI',
    midiNote: 'MIDI',
    midiCC: 'MIDI',
    midiNoteOutput: 'MIDI',
    midiCCOutput: 'MIDI',
    midiSync: 'MIDI',
};

function getCategoryLabel(nodeType: EditorNodeType): string {
    const category = CATEGORY_OVERRIDES[nodeType] ?? getNodeCatalogEntry(nodeType).category;
    return CATEGORY_LABELS[category];
}

function getHandleClassName(kind: NodeHandleKind, direction: 'source' | 'target'): string {
    const base = direction === 'source' ? 'handle handle-out' : 'handle handle-in';
    const kindClass = kind === 'audio'
        ? 'handle-audio'
        : kind === 'trigger'
            ? 'handle-trigger'
            : 'handle-param';
    return `${base} ${kindClass}`;
}

interface NodeShellProps {
    nodeType: EditorNodeType;
    title: string;
    selected?: boolean;
    badge?: ReactNode;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}

export function NodeShell({ nodeType, title, selected = false, badge, className = '', style, children }: NodeShellProps) {
    return (
        <div className={`audio-node node-shell ${nodeType}-node ${selected ? 'selected' : ''} ${className}`.trim()} style={style}>
            <div className="node-header node-shell__header">
                <div className="node-shell__header-group">
                    <span className="node-shell__header-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                    </span>
                    <span className="node-shell__header-category">{getCategoryLabel(nodeType)}</span>
                </div>
                <span className="node-shell__header-title">{title}</span>
                {badge ? <div className="node-shell__header-badge">{badge}</div> : <span className="node-shell__header-spacer" aria-hidden="true" />}
            </div>
            <div className="node-shell__body">
                {children}
            </div>
        </div>
    );
}

interface NodeHandleRowProps {
    direction: 'source' | 'target';
    label: string;
    handleId?: string;
    handleKind?: NodeHandleKind;
    trailing?: ReactNode;
    control?: ReactNode;
    className?: string;
}

export function NodeHandleRow({
    direction,
    label,
    handleId,
    handleKind = 'audio',
    trailing,
    control,
    className = '',
}: NodeHandleRowProps) {
    const isSource = direction === 'source';
    const hasControl = !isSource && Boolean(control);

    return (
        <div className={`node-shell__row node-shell__row--${direction} ${hasControl ? 'node-shell__row--with-control' : ''} ${className}`.trim()}>
            <div className="node-shell__row-main">
                {!isSource && handleId ? (
                    <CustomHandle
                        type="target"
                        position={Position.Left}
                        id={handleId}
                        className={getHandleClassName(handleKind, 'target')}
                    />
                ) : null}
                <span className={`node-shell__row-label ${isSource ? 'node-shell__row-label--source' : ''}`}>{label}</span>
                {trailing ? <div className="node-shell__row-trailing">{trailing}</div> : null}
                {isSource && handleId ? (
                    <CustomHandle
                        type="source"
                        position={Position.Right}
                        id={handleId}
                        className={getHandleClassName(handleKind, 'source')}
                    />
                ) : null}
            </div>
            {hasControl ? <div className="node-shell__row-control">{control}</div> : null}
        </div>
    );
}

interface NodeWidgetProps {
    title: ReactNode;
    children: ReactNode;
    className?: string;
    footer?: ReactNode;
}

export function NodeWidget({ title, children, className = '', footer }: NodeWidgetProps) {
    return (
        <div className={`node-shell__widget ${className}`.trim()}>
            <div className="node-shell__widget-title">{title}</div>
            <div className="node-shell__widget-body">{children}</div>
            {footer ? <div className="node-shell__widget-footer">{footer}</div> : null}
        </div>
    );
}

interface NodeWidgetTitleProps {
    icon?: Parameters<typeof EditorIcon>[0]['name'];
    children: ReactNode;
}

export function NodeWidgetTitle({ icon, children }: NodeWidgetTitleProps) {
    return (
        <span className="node-shell__widget-title-content">
            {icon ? <EditorIcon name={icon} className="node-shell__widget-title-icon" /> : null}
            <span>{children}</span>
        </span>
    );
}

interface NodeValueBadgeProps {
    children: ReactNode;
    live?: boolean;
    className?: string;
    dot?: boolean;
}

export function NodeValueBadge({ children, live = false, className = '', dot = live }: NodeValueBadgeProps) {
    return (
        <span className={`node-shell__badge ${live ? 'node-shell__badge--live' : ''} ${className}`.trim()}>
            {dot ? <span className="node-shell__badge-dot" aria-hidden="true" /> : null}
            <span>{children}</span>
        </span>
    );
}

interface NodeNumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
    value: number;
    onChange: (value: number) => void;
}

export function NodeNumberField({ value, onChange, className = '', ...props }: NodeNumberFieldProps) {
    const min = typeof props.min === 'number' && Number.isFinite(props.min) ? props.min : undefined;
    const max = typeof props.max === 'number' && Number.isFinite(props.max) ? props.max : undefined;
    const step = typeof props.step === 'number' && Number.isFinite(props.step) ? props.step : 0.01;
    const hasRange = typeof min === 'number' && typeof max === 'number';
    const isDisabled = Boolean(props.disabled);

    const [isEditing, setIsEditing] = useState(false);
    const [draftValue, setDraftValue] = useState(String(Number.isFinite(value) ? value : 0));
    const [isScrubbing, setIsScrubbing] = useState(false);
    const startRef = useRef<{ x: number; value: number; dragging: boolean } | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const suppressClickRef = useRef(false);

    const stepDecimals = useMemo(() => {
        const text = String(step);
        const [, decimals] = text.split('.');
        return decimals ? decimals.length : 0;
    }, [step]);

    const clampValue = (nextValue: number) => {
        let clamped = nextValue;
        if (typeof min === 'number') clamped = Math.max(min, clamped);
        if (typeof max === 'number') clamped = Math.min(max, clamped);
        return clamped;
    };

    const normalizeValue = (nextValue: number) => {
        if (!Number.isFinite(nextValue)) return clampValue(value);
        if (step > 0) {
            const rounded = Math.round(nextValue / step) * step;
            return clampValue(Number(rounded.toFixed(stepDecimals)));
        }
        return clampValue(nextValue);
    };

    const displayValue = useMemo(() => {
        const safeValue = Number.isFinite(value) ? value : 0;
        return stepDecimals > 0 ? safeValue.toFixed(stepDecimals) : String(Math.round(safeValue));
    }, [value, stepDecimals]);

    useEffect(() => {
        if (!isEditing) {
            setDraftValue(displayValue);
        }
    }, [displayValue, isEditing]);

    const commitDraft = (next: string) => {
        const parsed = Number(next);
        if (Number.isFinite(parsed)) {
            onChange(normalizeValue(parsed));
        }
        setIsEditing(false);
    };

    const handleScrubPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isDisabled || isEditing) return;
        startRef.current = { x: event.clientX, value: Number.isFinite(value) ? value : 0, dragging: false };
        suppressClickRef.current = false;
        setIsScrubbing(false);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleScrubPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const start = startRef.current;
        if (!start || isDisabled) return;
        const delta = event.clientX - start.x;
        if (!start.dragging && Math.abs(delta) > 3) {
            start.dragging = true;
            suppressClickRef.current = true;
            setIsScrubbing(true);
        }
        if (!start.dragging) return;

        const nextValue = start.value + (delta / 8) * step;
        onChange(normalizeValue(nextValue));
    };

    const handleScrubPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (startRef.current) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        startRef.current = null;
        setIsScrubbing(false);
        window.setTimeout(() => {
            suppressClickRef.current = false;
        }, 0);
    };

    const handleValueClick = () => {
        if (isDisabled || suppressClickRef.current) return;
        setIsEditing(true);
        requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        });
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setDraftValue(event.target.value);
    };

    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            commitDraft(draftValue);
        } else if (event.key === 'Escape') {
            setIsEditing(false);
            setDraftValue(displayValue);
        }
    };

    const handleStep = (direction: -1 | 1) => {
        if (isDisabled) return;
        onChange(normalizeValue((Number.isFinite(value) ? value : 0) + direction * step));
    };

    const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(normalizeValue(Number(event.target.value)));
    };

    return (
        <div
            className={`node-shell__number ${hasRange ? 'node-shell__number--range' : ''} ${isScrubbing ? 'is-scrubbing' : ''} ${className}`.trim()}
        >
            {!hasRange ? (
                <>
                    <button
                        type="button"
                        aria-label="Decrease value"
                        className="node-shell__number-step"
                        onClick={() => handleStep(-1)}
                        disabled={isDisabled}
                    >
                        &lt;
                    </button>
                    <div
                        className="node-shell__number-core"
                        onPointerDown={handleScrubPointerDown}
                        onPointerMove={handleScrubPointerMove}
                        onPointerUp={handleScrubPointerUp}
                        onPointerCancel={handleScrubPointerUp}
                    >
                        {isEditing ? (
                            <input
                                {...props}
                                ref={inputRef}
                                type="text"
                                inputMode="decimal"
                                value={draftValue}
                                onChange={handleInputChange}
                                onBlur={() => commitDraft(draftValue)}
                                onKeyDown={handleInputKeyDown}
                                className="node-shell__number-input"
                            />
                        ) : (
                            <button type="button" className="node-shell__number-value" onClick={handleValueClick} disabled={isDisabled}>
                                {displayValue}
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        aria-label="Increase value"
                        className="node-shell__number-step"
                        onClick={() => handleStep(1)}
                        disabled={isDisabled}
                    >
                        &gt;
                    </button>
                </>
            ) : (
                <>
                    <div className="node-shell__slider">
                        <div className="node-shell__slider-track" />
                        <div
                            className="node-shell__slider-fill"
                            style={{
                                width: (() => {
                                    const safeValue = Number.isFinite(value) ? value : 0;
                                    const range = (max ?? 1) - (min ?? 0);
                                    if (!Number.isFinite(range) || range === 0) return '0%';
                                    const percent = ((safeValue - (min ?? 0)) / range) * 100;
                                    return `${Math.min(100, Math.max(0, percent))}%`;
                                })(),
                            }}
                        />
                        <input
                            {...props}
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={Number.isFinite(value) ? value : 0}
                            onChange={handleSliderChange}
                            className="node-shell__slider-input"
                            aria-label={props['aria-label'] ?? 'Numeric slider'}
                            disabled={isDisabled}
                        />
                    </div>
                    {isEditing ? (
                        <input
                            {...props}
                            ref={inputRef}
                            type="text"
                            inputMode="decimal"
                            value={draftValue}
                            onChange={handleInputChange}
                            onBlur={() => commitDraft(draftValue)}
                            onKeyDown={handleInputKeyDown}
                            className="node-shell__number-input node-shell__number-input--inline"
                        />
                    ) : (
                        <button type="button" className="node-shell__number-value node-shell__number-value--inline" onClick={handleValueClick} disabled={isDisabled}>
                            {displayValue}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

interface NodeSelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    onChange: (value: string) => void;
    children: ReactNode;
}

export function NodeSelectField({ onChange, children, className = '', ...props }: NodeSelectFieldProps) {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        onChange(event.target.value);
    };

    return (
        <span className={`node-shell__select-wrap ${className}`.trim()}>
            <select {...props} onChange={handleChange} className="node-shell__field node-shell__select">
                {children}
            </select>
            <EditorIcon name="chevronDown" className="node-shell__select-icon" />
        </span>
    );
}

interface NodeTextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: string;
    onChange: (value: string) => void;
}

export function NodeTextField({ value, onChange, className = '', ...props }: NodeTextFieldProps) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value);
    };

    return (
        <input
            {...props}
            type="text"
            value={value}
            onChange={handleChange}
            className={`node-shell__field ${className}`.trim()}
        />
    );
}

interface NodeTextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
    value: string;
    onChange: (value: string) => void;
}

export function NodeTextAreaField({ value, onChange, className = '', ...props }: NodeTextAreaFieldProps) {
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event.target.value);
    };

    return (
        <textarea
            {...props}
            value={value}
            onChange={handleChange}
            className={`node-shell__field node-shell__textarea ${className}`.trim()}
        />
    );
}

interface NodeCheckboxFieldProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
    className?: string;
}

export function NodeCheckboxField({ checked, onChange, label, className = '' }: NodeCheckboxFieldProps) {
    return (
        <label className={`node-shell__checkbox ${className}`.trim()}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="node-shell__checkbox-input"
            />
            {label ? <span>{label}</span> : null}
        </label>
    );
}

export function NodeHelperText({ children }: { children: ReactNode }) {
    return <p className="node-shell__helper-text">{children}</p>;
}
