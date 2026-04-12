import type { AudioNodeData } from '../types';
import type { StudioNodePortInterface, StudioNodePortValueType } from './definition';

export type EditorNodeType = AudioNodeData['type'];
export type HandleDirection = 'source' | 'target';
export type PaletteCategory = 'Sources' | 'MIDI' | 'Effects' | 'Routing' | 'Math';

export interface HandleDescriptor {
    id: string;
    direction: HandleDirection;
    label: string;
    /** From YAML when catalog-backed; drives socket color and connection rules. */
    portValueType?: StudioNodePortValueType;
    /** From YAML for target ports; drives inline control (when not audio/trigger). */
    portInterface?: StudioNodePortInterface;
}

export interface NodeCatalogEntry {
    type: EditorNodeType;
    category: PaletteCategory;
    label: string;
    icon: string;
    color: string;
    singleton?: boolean;
}
