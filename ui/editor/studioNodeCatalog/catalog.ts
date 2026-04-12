/**
 * Load merged Studio node catalog: built-in YAML only, then optional JSON overrides.
 * Legacy `EDITOR_NODE_CATALOG` is not merged here — palette rows come solely from `built-in-nodes/`.
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import studioUserJson from './studio-node-catalog.json';
import { loadBuiltInNodeRawDefinitions } from './loadBuiltInNodeFiles';
import { normalizeStudioNodeDefinition } from './normalize';
import type { RawStudioNodeDefinition, StudioNodeDefinition } from './types';
import { validateStudioNodeDefinition } from './validate';

function parseUserCatalog(): RawStudioNodeDefinition[] {
    if (!Array.isArray(studioUserJson)) {
        return [];
    }
    return studioUserJson as RawStudioNodeDefinition[];
}

let cached: StudioNodeDefinition[] | null = null;

/**
 * Full catalog: per-node YAML under `built-in-nodes/`, then optional `studio-node-catalog.json` overrides by `name`.
 */
export function loadStudioNodeCatalog(): StudioNodeDefinition[] {
    if (cached) {
        return cached;
    }
    const byName = new Map<string, StudioNodeDefinition>();
    for (const raw of loadBuiltInNodeRawDefinitions()) {
        const norm = normalizeStudioNodeDefinition(raw);
        if (!norm.name) {
            continue;
        }
        const v = validateStudioNodeDefinition(norm);
        if (!v.ok) {
            if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
                console.warn(`[studio catalog] skipped invalid built-in node "${norm.name}":`, v.errors);
            }
            continue;
        }
        byName.set(norm.name, norm);
    }
    for (const raw of parseUserCatalog()) {
        const norm = normalizeStudioNodeDefinition(raw);
        if (!norm.name) {
            continue;
        }
        const v = validateStudioNodeDefinition(norm);
        if (!v.ok) {
            if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
                console.warn(`[studio catalog] skipped invalid "${norm.name}":`, v.errors);
            }
            continue;
        }
        byName.set(norm.name, norm);
    }
    cached = [...byName.values()];
    return cached;
}

/** Clear memoized catalog (tests). */
export function resetStudioNodeCatalogCache(): void {
    cached = null;
}

export function getStudioNodeDefinition(name: string): StudioNodeDefinition | undefined {
    return loadStudioNodeCatalog().find((d) => d.name === name);
}

/**
 * Faust source for DSP nodes — read only from catalog `dsp` (not DinDocument).
 */
export function getStudioDspSource(def: StudioNodeDefinition): string | undefined {
    if (def.type !== 'dsp') {
        return undefined;
    }
    return def.dsp;
}

/**
 * Registry key for a custom node shell, or `null` for the default shared shell.
 */
export function resolveStudioCustomComponentKey(def: StudioNodeDefinition): string | null {
    return def.customComponent;
}

/** Faust `dsp` string for an editor node `name`, when defined as a DSP catalog row. */
export function getStudioDspHintForEditorType(name: string): string | undefined {
    const def = getStudioNodeDefinition(name);
    if (!def) {
        return undefined;
    }
    return getStudioDspSource(def);
}
