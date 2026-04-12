/**
 * React Flow handle ids align 1:1 with catalog port `name` fields (§10.6).
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import type { StudioNodeDefinition } from './definition';
import type { HandleDescriptor } from './types';

/** Target handle ids (inputs[].name). */
export function getStudioTargetHandleIds(def: StudioNodeDefinition): string[] {
    return def.inputs.map((p) => p.name);
}

/** Source handle ids (outputs[].name). */
export function getStudioSourceHandleIds(def: StudioNodeDefinition): string[] {
    return def.outputs.map((p) => p.name);
}

/**
 * Humanize a port `name` when YAML has no explicit `label` (camelCase / snake → Title Case words).
 */
export function humanizeStudioPortName(name: string): string {
    const s = name.trim();
    if (!s) {
        return '';
    }
    const withSpaces = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ');
    return withSpaces
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

function portDisplayLabel(port: { name: string; label?: string | null }): string {
    if (port.label !== undefined && port.label !== null) {
        const t = port.label.trim();
        if (t.length > 0) {
            return t;
        }
    }
    return humanizeStudioPortName(port.name);
}

/**
 * Studio catalog ports → legacy handle descriptors for the graph (`inputs` = targets, `outputs` = sources).
 * Order: all targets in YAML input order, then all sources in YAML output order.
 */
export function studioDefinitionToHandleDescriptors(def: StudioNodeDefinition): HandleDescriptor[] {
    const targets: HandleDescriptor[] = def.inputs.map((p) => ({
        id: p.name,
        direction: 'target',
        label: portDisplayLabel(p),
        portValueType: p.type,
        portInterface: p.interface,
    }));
    const sources: HandleDescriptor[] = def.outputs.map((p) => ({
        id: p.name,
        direction: 'source',
        label: portDisplayLabel(p),
        portValueType: p.type,
        portInterface: p.interface,
    }));
    return [...targets, ...sources];
}
