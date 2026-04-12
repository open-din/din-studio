/**
 * Normalize optional fields from Studio catalog JSON per §10.9.
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import type { RawStudioNodeDefinition, StudioNodeDefinition, StudioNodePortSchema } from './types';

function normalizeTags(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.map((t) => String(t).trim().toLowerCase()).filter((t) => t.length > 0);
}

function normalizeOnePort(p: unknown): StudioNodePortSchema {
    if (!p || typeof p !== 'object') {
        return { type: 'float', name: '', interface: 'slider' };
    }
    const o = p as Record<string, unknown>;
    const name = String(o.name ?? '').trim();
    const type = (o.type as StudioNodePortSchema['type']) ?? 'float';
    const iface = (o.interface as StudioNodePortSchema['interface']) ?? 'slider';
    return { type, name, interface: iface };
}

function normalizePorts(raw: unknown): StudioNodePortSchema[] {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.map(normalizeOnePort);
}

/**
 * Apply defaults: `label` / `customComponent` null, empty `tags`, `inputs`, `outputs`.
 */
export function normalizeStudioNodeDefinition(raw: RawStudioNodeDefinition): StudioNodeDefinition {
    const name = String(raw.name ?? '').trim();
    const description = String(raw.description ?? '').trim();
    const category = String(raw.category ?? '').trim();
    const subcategory = String(raw.subcategory ?? '').trim();

    let label: string | null = null;
    if (raw.label !== undefined && raw.label !== null) {
        const l = String(raw.label).trim();
        label = l.length === 0 ? null : l;
    }

    let customComponent: string | null = null;
    if (raw.customComponent !== undefined && raw.customComponent !== null) {
        const c = String(raw.customComponent).trim();
        customComponent = c.length === 0 ? null : c;
    }

    const base: StudioNodeDefinition = {
        name,
        label,
        description,
        type: (raw.type ?? 'dsp') as StudioNodeDefinition['type'],
        inputs: normalizePorts(raw.inputs),
        outputs: normalizePorts(raw.outputs),
        customComponent,
        tags: normalizeTags(raw.tags),
        category,
        subcategory,
    };

    if (raw.type === 'dsp' && raw.dsp !== undefined && String(raw.dsp).trim() !== '') {
        return { ...base, dsp: String(raw.dsp).trim() };
    }
    return base;
}
