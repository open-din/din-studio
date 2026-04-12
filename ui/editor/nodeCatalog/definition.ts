/**
 * Built-in node YAML / JSON catalog definition types (din-studio `v2/specs/09-ui-components.md` §10).
 * Not aliases of `AudioNodeData` or DinDocument models.
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */

/** Studio UI taxonomy for palette/codegen — not the `.din` schema `type` field. */
export type StudioNodeType =
    | 'dsp'
    | 'interface'
    | 'value'
    | 'transport'
    | 'timeline'
    | 'voice'
    | 'asset';

export type StudioNodePortValueType = 'int' | 'float' | 'audio' | 'trigger' | 'bool' | 'enum';

export type StudioNodePortInterface = 'input' | 'slider' | 'checkbox';

/**
 * Shared port row for both inputs (React Flow targets) and outputs (sources).
 * Optional `label` is the handle label on the graph; when omitted, a humanized `name` is used at runtime.
 */
export interface StudioNodePortSchema {
    type: StudioNodePortValueType;
    name: string;
    interface: StudioNodePortInterface;
    /** Display label for React Flow handles; null/absent means derive from `name`. */
    label?: string | null;
    /** For `int` / `float`: optional default and range for inspector / canvas controls. */
    default?: number;
    min?: number;
    max?: number;
    step?: number;
    /** For `type === 'enum'`: allowed values; required when type is enum. */
    enumOptions?: string[];
    /**
     * For `type === 'enum'`: default selected option (must appear in `enumOptions` when both set).
     * For `int` / `float`, use `default` (number).
     */
    enumDefault?: string;
}

/**
 * Normalized catalog row after JSON load + defaults.
 */
export interface StudioNodeDefinition {
    name: string;
    label: string | null;
    description: string;
    type: StudioNodeType;
    inputs: StudioNodePortSchema[];
    outputs: StudioNodePortSchema[];
    customComponent: string | null;
    tags: string[];
    category: string;
    subcategory: string;
    /** Palette / node chrome color (hex), e.g. `#44cc44`. */
    color?: string | null;
    /** Emoji or short glyph for palette and docs. */
    icon?: string | null;
    /** When true, only one instance should exist in a graph (e.g. output, transport). */
    singleton?: boolean;
    /**
     * When true, the inspector allows editing the inputs port list for this node instance
     * (`studioPortOverrides.inputs` in graph state).
     */
    editableInputsParams?: boolean;
    /**
     * When true, the inspector allows editing the outputs port list for this node instance
     * (`studioPortOverrides.outputs` in graph state).
     */
    editableOutputsParams?: boolean;
    /** Present only for `type === 'dsp'` (non-empty Faust source). */
    dsp?: string;
}

/**
 * Raw JSON shape before normalization (optional fields allowed).
 */
export type RawStudioNodeDefinition = Partial<StudioNodeDefinition> & {
    name?: string;
};

export interface StudioNodeValidationResult {
    ok: boolean;
    errors: string[];
}

/**
 * Per-graph-instance overrides for catalog ports when `editableInputsParams` / `editableOutputsParams` are true.
 * Each side is optional: when absent, the corresponding side uses the static catalog list.
 */
export interface StudioPortOverrides {
    inputs?: StudioNodePortSchema[];
    outputs?: StudioNodePortSchema[];
}
