/**
 * React Flow handle ids align 1:1 with catalog port `name` fields (§10.6).
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import type { StudioNodeDefinition } from './types';

/** Target handle ids (inputs[].name). */
export function getStudioTargetHandleIds(def: StudioNodeDefinition): string[] {
    return def.inputs.map((p) => p.name);
}

/** Source handle ids (outputs[].name). */
export function getStudioSourceHandleIds(def: StudioNodeDefinition): string[] {
    return def.outputs.map((p) => p.name);
}
