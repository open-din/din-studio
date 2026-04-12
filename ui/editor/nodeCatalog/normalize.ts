/**
 * Normalize optional fields from Studio catalog JSON per §10.9.
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import type { RawStudioNodeDefinition, StudioNodeDefinition, StudioNodePortSchema } from './definition';
import { findHsliderForPortName, parseFaustHsliders, type ParsedFaustHslider } from './parseFaustHsliders';

function normalizeTags(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.map((t) => String(t).trim().toLowerCase()).filter((t) => t.length > 0);
}

function numOrUndef(v: unknown): number | undefined {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function strArrOrUndef(v: unknown): string[] | undefined {
    if (!Array.isArray(v)) return undefined;
    const out = v.map((x) => String(x).trim()).filter((s) => s.length > 0);
    return out.length > 0 ? out : undefined;
}

function normalizeOnePort(p: unknown): StudioNodePortSchema {
    if (!p || typeof p !== 'object') {
        return { type: 'float', name: '', interface: 'slider' };
    }
    const o = p as Record<string, unknown>;
    const name = String(o.name ?? '').trim();
    let rawType = String(o.type ?? 'float').trim();
    if (rawType === 'number') {
        rawType = 'float';
    }
    const type = rawType as StudioNodePortSchema['type'];
    const iface = (o.interface as StudioNodePortSchema['interface']) ?? 'slider';
    let portLabel: string | null = null;
    if (o.label !== undefined && o.label !== null) {
        const pl = String(o.label).trim();
        portLabel = pl.length === 0 ? null : pl;
    }
    const base: StudioNodePortSchema = { type, name, interface: iface, label: portLabel };

    const d = numOrUndef(o.default);
    if (d !== undefined) {
        base.default = d;
    }
    const mn = numOrUndef(o.min);
    if (mn !== undefined) {
        base.min = mn;
    }
    const mx = numOrUndef(o.max);
    if (mx !== undefined) {
        base.max = mx;
    }
    const st = numOrUndef(o.step);
    if (st !== undefined) {
        base.step = st;
    }
    const enumOpts = strArrOrUndef(o.enumOptions);
    if (enumOpts) {
        base.enumOptions = enumOpts;
    }
    if (o.enumDefault !== undefined && o.enumDefault !== null) {
        const ed = String(o.enumDefault).trim();
        if (ed.length > 0) {
            base.enumDefault = ed;
        }
    }

    return base;
}

function normalizePorts(raw: unknown): StudioNodePortSchema[] {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.map(normalizeOnePort);
}

function mergePortFillIfMissingFromHslider(
    port: StudioNodePortSchema,
    sliders: Map<string, ParsedFaustHslider>,
): StudioNodePortSchema {
    if (port.type !== 'float' && port.type !== 'int') return port;
    const meta = findHsliderForPortName(sliders, port.name);
    if (!meta) return port;
    return {
        ...port,
        ...(port.default === undefined ? { default: meta.default } : {}),
        ...(port.min === undefined ? { min: meta.min } : {}),
        ...(port.max === undefined ? { max: meta.max } : {}),
        ...(port.step === undefined ? { step: meta.step } : {}),
    };
}

function mergeInputsWithFaustHsliders(def: StudioNodeDefinition & { dsp: string }): StudioNodeDefinition {
    const sliders = parseFaustHsliders(def.dsp);
    if (sliders.size === 0) return def;
    return {
        ...def,
        inputs: def.inputs.map((p) => mergePortFillIfMissingFromHslider(p, sliders)),
    };
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

    let editableInputsParams = false;
    if (raw.editableInputsParams !== undefined && raw.editableInputsParams !== null) {
        editableInputsParams = Boolean(raw.editableInputsParams);
    }
    let editableOutputsParams = false;
    if (raw.editableOutputsParams !== undefined && raw.editableOutputsParams !== null) {
        editableOutputsParams = Boolean(raw.editableOutputsParams);
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
        editableInputsParams,
        editableOutputsParams,
        ...(color !== null ? { color } : {}),
        ...(icon !== null ? { icon } : {}),
        ...(singleton !== undefined ? { singleton } : {}),
    };

    if (raw.type === 'dsp' && raw.dsp !== undefined && String(raw.dsp).trim() !== '') {
        const dsp = String(raw.dsp).trim();
        return mergeInputsWithFaustHsliders({ ...base, dsp });
    }
    return base;
}
