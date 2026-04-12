/**
 * Map catalog port value types to React Flow handle styling (§10 sockets).
 * Aligns with {@link NodeShell} `NodeHandleKind` (`audio` | `control` | `trigger`).
 */
import type { StudioNodePortValueType } from './definition';
import type { HandleDescriptor } from './types';

export type PortHandleKind = 'audio' | 'control' | 'trigger';

export function portValueTypeToHandleKind(portType: StudioNodePortValueType): PortHandleKind {
    switch (portType) {
        case 'audio':
            return 'audio';
        case 'trigger':
            return 'trigger';
        case 'int':
        case 'float':
        case 'bool':
        case 'enum':
            return 'control';
        default: {
            const _exhaustive: never = portType;
            return _exhaustive;
        }
    }
}

/**
 * Prefer YAML `portValueType` on the descriptor; otherwise caller should use {@link inferHandleKind}.
 */
export function descriptorToHandleKind(descriptor: HandleDescriptor): PortHandleKind | null {
    if (descriptor.portValueType) {
        return portValueTypeToHandleKind(descriptor.portValueType);
    }
    return null;
}
