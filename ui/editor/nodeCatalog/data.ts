import type { MathNodeData } from '../types';
import { loadStudioNodeCatalog } from './catalog';
import type { StudioNodeDefinition } from './definition';
import type { EditorNodeType, NodeCatalogEntry, PaletteCategory } from './types';
import { humanizeStudioNodeName } from './title';

export const PATCH_AUDIO_INPUT_HANDLE = 'in';
export const PATCH_AUDIO_OUTPUT_HANDLE = 'out';
export const PATCH_INPUT_HANDLE_PREFIX = 'in:';
export const PATCH_OUTPUT_HANDLE_PREFIX = 'out:';

export const MATH_OPERATION_INPUT_LABELS: Record<MathNodeData['operation'], Array<{ id: 'a' | 'b' | 'c'; label: string }>> = {
    add: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    subtract: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    multiply: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    divide: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    multiplyAdd: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }],
    power: [{ id: 'a', label: 'Base' }, { id: 'b', label: 'Exponent' }],
    logarithm: [{ id: 'a', label: 'Value' }, { id: 'b', label: 'Base' }],
    sqrt: [{ id: 'a', label: 'Value' }],
    invSqrt: [{ id: 'a', label: 'Value' }],
    abs: [{ id: 'a', label: 'Value' }],
    exp: [{ id: 'a', label: 'Value' }],
    min: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    max: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    lessThan: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    greaterThan: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    sign: [{ id: 'a', label: 'Value' }],
    compare: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    smoothMin: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'Smooth' }],
    smoothMax: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'Smooth' }],
    round: [{ id: 'a', label: 'Value' }],
    floor: [{ id: 'a', label: 'Value' }],
    ceil: [{ id: 'a', label: 'Value' }],
    truncate: [{ id: 'a', label: 'Value' }],
    fraction: [{ id: 'a', label: 'Value' }],
    truncModulo: [{ id: 'a', label: 'Value' }, { id: 'b', label: 'Divisor' }],
    floorModulo: [{ id: 'a', label: 'Value' }, { id: 'b', label: 'Divisor' }],
    wrap: [{ id: 'a', label: 'Value' }, { id: 'b', label: 'Min' }, { id: 'c', label: 'Max' }],
    snap: [{ id: 'a', label: 'Value' }, { id: 'b', label: 'Step' }],
    pingPong: [{ id: 'a', label: 'Value' }, { id: 'b', label: 'Length' }],
    sin: [{ id: 'a', label: 'Value' }],
    cos: [{ id: 'a', label: 'Value' }],
    tan: [{ id: 'a', label: 'Value' }],
    asin: [{ id: 'a', label: 'Value' }],
    acos: [{ id: 'a', label: 'Value' }],
    atan: [{ id: 'a', label: 'Value' }],
    atan2: [{ id: 'a', label: 'Y' }, { id: 'b', label: 'X' }],
    sinh: [{ id: 'a', label: 'Value' }],
    cosh: [{ id: 'a', label: 'Value' }],
    tanh: [{ id: 'a', label: 'Value' }],
};

/** Maps first path segment from `built-in-nodes/<segment>/...` (see `categorySlugToCategoryLabel`). */
export function mapStudioCategoryToPaletteCategory(def: StudioNodeDefinition): PaletteCategory {
    switch (def.category) {
        case 'AUDIO':
            return 'Effects';
        case 'Sources':
            return 'Sources';
        case 'MIDI':
            return 'MIDI';
        case 'Routing':
            return 'Routing';
        case 'Math':
            return 'Math';
        default:
            return 'Effects';
    }
}

export { humanizeStudioNodeName } from './title';

function studioDefToNodeCatalogEntry(def: StudioNodeDefinition): NodeCatalogEntry {
    const rawLabel = def.label?.trim();
    const label = rawLabel && rawLabel.length > 0 ? rawLabel : humanizeStudioNodeName(def.name);
    const icon = def.icon?.trim() || '•';
    const color = def.color?.trim() || '#7bd1ff';
    return {
        type: def.name as EditorNodeType,
        category: mapStudioCategoryToPaletteCategory(def),
        label,
        icon,
        color,
        ...(def.singleton === true ? { singleton: true } : {}),
    };
}

/**
 * Palette rows and chrome metadata — derived from built-in node YAML under `ui/editor/built-in-nodes/` (+ JSON overrides).
 */
export function getEditorNodeCatalog(): NodeCatalogEntry[] {
    return loadStudioNodeCatalog().map(studioDefToNodeCatalogEntry);
}

export const NODE_CATEGORY_ORDER: PaletteCategory[] = ['Sources', 'MIDI', 'Effects', 'Routing', 'Math'];
