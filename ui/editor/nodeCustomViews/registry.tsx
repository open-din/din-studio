import type { ComponentType } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import type { AudioNodeData } from '../types';
import { ConvolverNodeView } from '../nodeWidgetComponents/layouts/ConvolverNodeView';
import { PianoRollNodeView } from '../nodeWidgetComponents/layouts/PianoRollNodeView';
import { SamplerNodeView } from '../nodeWidgetComponents/layouts/SamplerNodeView';
import { StepSequencerNodeView } from '../nodeWidgetComponents/layouts/StepSequencerNodeView';

export type StudioNodeCustomView = ComponentType<NodeProps<Node<AudioNodeData>>>;

/**
 * Canvas node body overrides (`customComponent` registry keys → layouts under `nodeWidgetComponents/layouts/`).
 *
 * | Key | Layout module |
 * |-----|----------------|
 * | `sampler` | `SamplerNodeView` |
 * | `convolver` | `ConvolverNodeView` |
 * | `stepSequencer` | `StepSequencerNodeView` |
 * | `pianoRoll` | `PianoRollNodeView` |
 */
export const STUDIO_NODE_CUSTOM_VIEWS: Record<string, StudioNodeCustomView> = {
    sampler: SamplerNodeView as StudioNodeCustomView,
    convolver: ConvolverNodeView as StudioNodeCustomView,
    stepSequencer: StepSequencerNodeView as StudioNodeCustomView,
    pianoRoll: PianoRollNodeView as StudioNodeCustomView,
};
