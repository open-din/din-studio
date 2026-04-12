/**
 * Normalize optional fields from Studio catalog JSON per §10.9.
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import type { RawStudioNodeDefinition, StudioNodeDefinition, StudioNodePortSchema } from './definition';

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
    let portLabel: string | null = null;
    if (o.label !== undefined && o.label !== null) {
        const pl = String(o.label).trim();
        portLabel = pl.length === 0 ? null : pl;
    }
    return { type, name, interface: iface, label: portLabel };
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

    let color: string | null = null;
    if (raw.color !== undefined && raw.color !== null) {
        const c = String(raw.color).trim();
        color = c.length === 0 ? null : c;
    }

    let icon: string | null = null;
    if (raw.icon !== undefined && raw.icon !== null) {
        const i = String(raw.icon).trim();
        icon = i.length === 0 ? null : i;
    }

    let singleton: boolean | undefined;
    if (raw.singleton !== undefined && raw.singleton !== null) {
        singleton = Boolean(raw.singleton);
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
        ...(color !== null ? { color } : {}),
        ...(icon !== null ? { icon } : {}),
        ...(singleton !== undefined ? { singleton } : {}),
    };

    if (raw.type === 'dsp' && raw.dsp !== undefined && String(raw.dsp).trim() !== '') {
        return { ...base, dsp: String(raw.dsp).trim() };
    }
    return base;
}
