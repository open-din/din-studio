import type { AudioNodeData, PatchNodeData, PatchSlot } from '../types';
import { getInputParamHandleId } from '../handleIds';
import { getStudioNodeDefinition } from './catalog';
import { resolveStudioPortsToHandleDescriptors } from './handles';
import { MATH_OPERATION_INPUT_LABELS, PATCH_AUDIO_INPUT_HANDLE, PATCH_AUDIO_OUTPUT_HANDLE, PATCH_INPUT_HANDLE_PREFIX, PATCH_OUTPUT_HANDLE_PREFIX } from './data';
import type { StudioNodePortValueType } from './definition';
import type { HandleDescriptor, HandleDirection } from './types';

function patchSlotPortValueType(slotType: PatchSlot['type']): StudioNodePortValueType {
    return slotType === 'audio' ? 'audio' : 'trigger';
}

function buildParamHandles(data: Extract<AudioNodeData, { type: 'input' | 'uiTokens' }>): HandleDescriptor[] {
    return data.params.map((param) => ({
        id: getInputParamHandleId(param.id),
        direction: 'source',
        label: param.label || param.name,
        portValueType:
            param.socketKind === 'audio' || param.type === 'audio'
                ? 'audio'
                : param.socketKind === 'trigger' || param.type === 'trigger' || param.type === 'event'
                    ? 'trigger'
                    : param.type === 'int'
                        ? 'int'
                        : 'float',
    }));
}

function buildPatchHandles(data: PatchNodeData): HandleDescriptor[] {
    const handles: HandleDescriptor[] = [];
    const seen = new Set<string>();

    const pushHandle = (
        id: string,
        direction: HandleDirection,
        label: string,
        portValueType: StudioNodePortValueType,
    ) => {
        if (!id || seen.has(id)) return;
        seen.add(id);
        handles.push({ id, direction, label, portValueType });
    };

    pushHandle(
        PATCH_AUDIO_INPUT_HANDLE,
        'target',
        data.audio?.input?.label?.trim() || 'Audio In',
        'audio',
    );
    pushHandle(
        PATCH_AUDIO_OUTPUT_HANDLE,
        'source',
        data.audio?.output?.label?.trim() || 'Audio Out',
        'audio',
    );

    for (const slot of data.inputs ?? []) {
        const slotId = String(slot?.id ?? '').trim();
        if (!slotId) continue;
        pushHandle(
            `${PATCH_INPUT_HANDLE_PREFIX}${slotId}`,
            'target',
            String(slot?.label ?? '').trim() || slotId,
            patchSlotPortValueType(slot.type),
        );
    }

    for (const slot of data.outputs ?? []) {
        const slotId = String(slot?.id ?? '').trim();
        if (!slotId) continue;
        pushHandle(
            `${PATCH_OUTPUT_HANDLE_PREFIX}${slotId}`,
            'source',
            String(slot?.label ?? '').trim() || slotId,
            patchSlotPortValueType(slot.type),
        );
    }

    return handles;
}

export function getNodeHandleDescriptors(data: AudioNodeData): HandleDescriptor[] {
    switch (data.type) {
        case 'input':
        case 'uiTokens':
            return buildParamHandles(data);
        case 'math': {
            const inputs = MATH_OPERATION_INPUT_LABELS[data.operation] ?? MATH_OPERATION_INPUT_LABELS.add;
            return [
                { id: 'out', direction: 'source', label: 'Out', portValueType: 'float', portInterface: 'slider' },
                ...inputs.map((input) => ({
                    id: input.id,
                    direction: 'target' as const,
                    label: input.label,
                    portValueType: 'float' as const,
                    portInterface: 'slider' as const,
                })),
            ];
        }
        case 'switch': {
            const inputs = Math.min(Math.max(data.inputs || 2, 2), 8);
            return [
                { id: 'out', direction: 'source', label: 'Out', portValueType: 'float', portInterface: 'slider' },
                { id: 'index', direction: 'target', label: 'Index', portValueType: 'float', portInterface: 'slider' },
                ...Array.from({ length: inputs }, (_, index) => ({
                    id: `in_${index}`,
                    direction: 'target' as const,
                    label: `In ${index + 1}`,
                    portValueType: 'float' as const,
                    portInterface: 'slider' as const,
                })),
            ];
        }
        case 'matrixMixer': {
            const inputs = Math.min(Math.max(data.inputs || 4, 2), 8);
            const outputs = Math.min(Math.max(data.outputs || 4, 2), 8);
            const handles: HandleDescriptor[] = [
                ...Array.from({ length: inputs }, (_, index) => ({
                    id: `in${index + 1}`,
                    direction: 'target' as const,
                    label: `In ${index + 1}`,
                    portValueType: 'audio' as const,
                    portInterface: 'input' as const,
                })),
                { id: 'out', direction: 'source', label: 'Out Mix', portValueType: 'audio', portInterface: 'input' },
                ...Array.from({ length: outputs }, (_, index) => ({
                    id: `out${index + 1}`,
                    direction: 'source' as const,
                    label: `Out ${index + 1}`,
                    portValueType: 'audio' as const,
                    portInterface: 'input' as const,
                })),
            ];

            for (let row = 0; row < inputs; row += 1) {
                for (let column = 0; column < outputs; column += 1) {
                    handles.push({
                        id: `cell:${row}:${column}`,
                        direction: 'target',
                        label: `M${row + 1}${column + 1}`,
                        portValueType: 'float',
                        portInterface: 'slider',
                    });
                }
            }

            return handles;
        }
        case 'patch':
            return buildPatchHandles(data);
        default: {
            const studioDef = getStudioNodeDefinition(data.type);
            if (studioDef) {
                return resolveStudioPortsToHandleDescriptors(data, studioDef);
            }
            return [];
        }
    }
}
