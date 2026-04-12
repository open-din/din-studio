/**
 * Structural validation for `StudioNodeDefinition` (§10.5).
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import type { StudioNodeDefinition, StudioNodePortSchema, StudioNodeValidationResult } from './definition';

const STUDIO_NODE_TYPES = new Set<StudioNodeDefinition['type']>([
    'dsp',
    'interface',
    'value',
    'transport',
    'timeline',
    'voice',
    'asset',
]);

const PORT_VALUE_TYPES = new Set<StudioNodePortSchema['type']>(['int', 'float', 'audio', 'trigger', 'bool', 'enum']);

const PORT_INTERFACE_TYPES = new Set<StudioNodePortSchema['interface']>(['input', 'slider', 'checkbox']);

function uniqueNamesInPorts(ports: StudioNodePortSchema[], label: string, errors: string[]): void {
    const seen = new Set<string>();
    for (const p of ports) {
        const n = p.name?.trim() ?? '';
        if (!n) {
            errors.push(`${label}: port name must be non-empty`);
            continue;
        }
        if (seen.has(n)) {
            errors.push(`${label}: duplicate port name "${n}"`);
        }
        seen.add(n);
    }
}

/**
 * Validate a normalized definition. Does not mutate input.
 */
export function validateStudioNodeDefinition(def: StudioNodeDefinition): StudioNodeValidationResult {
    const errors: string[] = [];

    if (!def.name.trim()) {
        errors.push('name must be a non-empty string');
    }
    if (def.label !== null && def.label.trim() === '') {
        errors.push('label must be null or a non-empty string');
    }
    if (!def.description.trim()) {
        errors.push('description must be non-empty');
    }
    if (!def.category.trim()) {
        errors.push('category must be non-empty');
    }
    if (!def.subcategory.trim()) {
        errors.push('subcategory must be non-empty');
    }
    if (!STUDIO_NODE_TYPES.has(def.type)) {
        errors.push(`type "${def.type}" is not a valid StudioNodeType`);
    }
    if (def.customComponent !== null && def.customComponent.trim() === '') {
        errors.push('customComponent must be null or a non-empty registry key');
    }

    if (def.color !== undefined && def.color !== null && def.color.trim() === '') {
        errors.push('color must be null, undefined, or a non-empty string');
    }
    if (def.icon !== undefined && def.icon !== null && def.icon.trim() === '') {
        errors.push('icon must be null, undefined, or a non-empty string');
    }
    if (def.singleton !== undefined && typeof def.singleton !== 'boolean') {
        errors.push('singleton must be a boolean when set');
    }
    if (def.editableInputsParams !== undefined && typeof def.editableInputsParams !== 'boolean') {
        errors.push('editableInputsParams must be a boolean when set');
    }
    if (def.editableOutputsParams !== undefined && typeof def.editableOutputsParams !== 'boolean') {
        errors.push('editableOutputsParams must be a boolean when set');
    }

    for (const t of def.tags) {
        if (!t.trim()) {
            errors.push('tags must contain only non-empty strings');
        }
    }

    uniqueNamesInPorts(def.inputs, 'inputs', errors);
    uniqueNamesInPorts(def.outputs, 'outputs', errors);

    for (const port of [...def.inputs, ...def.outputs]) {
        if (!PORT_VALUE_TYPES.has(port.type)) {
            errors.push(`port "${port.name}" has invalid type "${port.type}"`);
        }
        if (!PORT_INTERFACE_TYPES.has(port.interface)) {
            errors.push(`port "${port.name}" has invalid interface "${port.interface}"`);
        }
        if (port.label !== undefined && port.label !== null && port.label.trim() === '') {
            errors.push(`port "${port.name}" label must be null or a non-empty string`);
        }

        if (port.type === 'enum') {
            if (!port.enumOptions || port.enumOptions.length === 0) {
                errors.push(`port "${port.name}" (enum) requires non-empty enumOptions`);
            }
            if (port.enumDefault !== undefined && port.enumOptions && !port.enumOptions.includes(port.enumDefault)) {
                errors.push(`port "${port.name}" enumDefault must be one of enumOptions`);
            }
        } else if (port.enumOptions !== undefined || port.enumDefault !== undefined) {
            errors.push(`port "${port.name}" enumOptions/enumDefault are only valid when type is enum`);
        }

        const hasNumericMeta =
            port.default !== undefined || port.min !== undefined || port.max !== undefined || port.step !== undefined;
        if (hasNumericMeta && port.type !== 'int' && port.type !== 'float') {
            errors.push(`port "${port.name}" default/min/max/step are only for int/float ports`);
        }
        if ((port.type === 'int' || port.type === 'float') && port.min !== undefined && port.max !== undefined && port.min > port.max) {
            errors.push(`port "${port.name}" min must be <= max`);
        }
    }

    if (def.type === 'dsp') {
        if (!def.dsp || def.dsp.trim() === '') {
            errors.push('dsp nodes require a non-empty dsp string');
        }
    } else if (def.dsp !== undefined) {
        errors.push('dsp field is only allowed when type is "dsp"');
    }

    return { ok: errors.length === 0, errors };
}
