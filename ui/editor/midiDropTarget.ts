import type { Node } from '@xyflow/react';
import type { AudioNodeData } from './types';
import type { EditorNodeType } from './nodeCatalog';
import { DEFAULT_NODE_SIZE } from './graphBuilders';
import type { MidiDeviceDragPayload } from './midiDragData';

function nodeBounds(node: Node<AudioNodeData>): { w: number; h: number } {
    const measured = node.measured;
    const w = measured?.width ?? node.width ?? DEFAULT_NODE_SIZE.width;
    const h = measured?.height ?? node.height ?? DEFAULT_NODE_SIZE.height;
    return { w, h };
}

/** Top-most graph node at flow coordinates that can receive a MIDI device assignment. */
export function findMidiAssignableNodeAtFlowPosition(
    nodes: Node<AudioNodeData>[],
    flowPosition: { x: number; y: number },
    portType: MidiDeviceDragPayload['portType']
): Node<AudioNodeData> | null {
    for (let i = nodes.length - 1; i >= 0; i -= 1) {
        const node = nodes[i];
        const { w, h } = nodeBounds(node);
        const inside =
            flowPosition.x >= node.position.x
            && flowPosition.x <= node.position.x + w
            && flowPosition.y >= node.position.y
            && flowPosition.y <= node.position.y + h;
        if (!inside) continue;

        const nodeType = node.data.type;
        if (portType === 'input' && (nodeType === 'midiNote' || nodeType === 'midiCC' || nodeType === 'midiSync')) {
            return node;
        }
        if (portType === 'output' && (nodeType === 'midiNoteOutput' || nodeType === 'midiCCOutput' || nodeType === 'midiSync')) {
            return node;
        }
    }
    return null;
}

export function buildMidiNodeDataPatch(
    node: Node<AudioNodeData>,
    portType: MidiDeviceDragPayload['portType'],
    deviceId: string
): Partial<AudioNodeData> | null {
    const nodeType = node.data.type;
    if (portType === 'input') {
        if (nodeType === 'midiNote' || nodeType === 'midiCC') {
            return { inputId: deviceId as never };
        }
        if (nodeType === 'midiSync') {
            return { inputId: deviceId };
        }
    } else if (portType === 'output') {
        if (nodeType === 'midiNoteOutput' || nodeType === 'midiCCOutput') {
            return { outputId: deviceId };
        }
        if (nodeType === 'midiSync') {
            return { outputId: deviceId };
        }
    }
    return null;
}

/** Partial node data when creating a node from a device drag (palette uses plain types without device payload). */
export function buildMidiOverridesForNewNode(
    editorType: EditorNodeType,
    payload: MidiDeviceDragPayload
): Partial<AudioNodeData> | null {
    if (payload.portType === 'input') {
        if (editorType === 'midiNote' || editorType === 'midiCC') {
            return { inputId: payload.deviceId as never };
        }
    } else if (editorType === 'midiNoteOutput' || editorType === 'midiCCOutput') {
        return { outputId: payload.deviceId };
    }
    return null;
}
