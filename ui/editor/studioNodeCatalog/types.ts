/**
 * Studio-only node UI catalog types (din-studio `v2/specs/09-ui-components.md` §10).
 * These types are intentionally **not** aliases of `AudioNodeData` or DinDocument models.
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
 */
export interface StudioNodePortSchema {
    type: StudioNodePortValueType;
    name: string;
    interface: StudioNodePortInterface;
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
