/**
 * React Flow handle ids align 1:1 with catalog port `name` fields (§10.6).
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import type { StudioNodeDefinition, StudioNodePortSchema, StudioPortOverrides } from './definition';
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
 * Resolved port lists for a node instance: catalog defaults, optionally replaced per side by `studioPortOverrides`.
 */
export function resolveStudioPortsForInstance(
    data: { studioPortOverrides?: StudioPortOverrides },
    def: StudioNodeDefinition,
): { inputs: StudioNodePortSchema[]; outputs: StudioNodePortSchema[] } {
    const o = data.studioPortOverrides;
    return {
        inputs: o?.inputs !== undefined ? o.inputs : def.inputs,
        outputs: o?.outputs !== undefined ? o.outputs : def.outputs,
    };
}

/**
 * Studio port rows → legacy handle descriptors (`inputs` = targets, `outputs` = sources).
 * Order: all targets in input order, then all sources in output order.
 */
export function studioPortSchemasToHandleDescriptors(
    inputs: StudioNodePortSchema[],
    outputs: StudioNodePortSchema[],
): HandleDescriptor[] {
    const targets: HandleDescriptor[] = inputs.map((p) => ({
        id: p.name,
        direction: 'target' as const,
        label: portDisplayLabel(p),
        portValueType: p.type,
        portInterface: p.interface,
        catalogPort: p,
    }));
    const sources: HandleDescriptor[] = outputs.map((p) => ({
        id: p.name,
        direction: 'source' as const,
        label: portDisplayLabel(p),
        portValueType: p.type,
        portInterface: p.interface,
        catalogPort: p,
    }));
    return [...targets, ...sources];
}

/**
 * Merged instance ports → handle descriptors (see {@link resolveStudioPortsForInstance}).
 */
export function resolveStudioPortsToHandleDescriptors(
    data: { studioPortOverrides?: StudioPortOverrides },
    def: StudioNodeDefinition,
): HandleDescriptor[] {
    const { inputs, outputs } = resolveStudioPortsForInstance(data, def);
    return studioPortSchemasToHandleDescriptors(inputs, outputs);
}

/**
 * Studio catalog ports → legacy handle descriptors for the graph (`inputs` = targets, `outputs` = sources).
 * Order: all targets in YAML input order, then all sources in YAML output order.
 */
export function studioDefinitionToHandleDescriptors(def: StudioNodeDefinition): HandleDescriptor[] {
    return studioPortSchemasToHandleDescriptors(def.inputs, def.outputs);
}
