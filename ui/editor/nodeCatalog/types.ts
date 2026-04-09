import type { AudioNodeData } from '../types';

export type EditorNodeType = AudioNodeData['type'];
export type HandleDirection = 'source' | 'target';
export type PaletteCategory = 'Sources' | 'MIDI' | 'Effects' | 'Routing' | 'Math';

export interface HandleDescriptor {
    id: string;
    direction: HandleDirection;
    label: string;
}

export interface NodeCatalogEntry {
    type: EditorNodeType;
    category: PaletteCategory;
    label: string;
    icon: string;
    color: string;
    singleton?: boolean;
}
