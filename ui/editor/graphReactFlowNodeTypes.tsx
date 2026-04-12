/**
 * Maps Studio catalog node `name` → React Flow `type` (`${name}Node`) and TSX view.
 * React Flow registrations are built only from {@link loadStudioNodeCatalog} (built-in YAML + JSON).
 *
 * Per-node TSX modules remain the implementation; `ui/editor/nodes/index.ts` is a reference barrel only.
 */
import type { ComponentType } from 'react';
import type { Node, NodeProps, NodeTypes } from '@xyflow/react';
import type { AudioNodeData } from './types';
import type { EditorNodeType } from './nodeCatalog';
import { loadStudioNodeCatalog } from './studioNodeCatalog/catalog';

import { OscNode } from './nodes/OscNode';
import GainNode from './nodes/GainNode';
import FilterNode from './nodes/FilterNode';
import OutputNode from './nodes/OutputNode';
import NoiseNode from './nodes/NoiseNode';
import DelayNode from './nodes/DelayNode';
import ReverbNode from './nodes/ReverbNode';
import CompressorNode from './nodes/CompressorNode';
import PhaserNode from './nodes/PhaserNode';
import FlangerNode from './nodes/FlangerNode';
import TremoloNode from './nodes/TremoloNode';
import EQ3Node from './nodes/EQ3Node';
import DistortionNode from './nodes/DistortionNode';
import ChorusNode from './nodes/ChorusNode';
import NoiseBurstNode from './nodes/NoiseBurstNode';
import WaveShaperNode from './nodes/WaveShaperNode';
import ConvolverNode from './nodes/ConvolverNode';
import AnalyzerNode from './nodes/AnalyzerNode';
import StereoPannerNode from './nodes/StereoPannerNode';
import Panner3DNode from './nodes/Panner3DNode';
import MixerNode from './nodes/MixerNode';
import AuxSendNode from './nodes/AuxSendNode';
import AuxReturnNode from './nodes/AuxReturnNode';
import MatrixMixerNode from './nodes/MatrixMixerNode';
import InputNode from './nodes/InputNode';
import UiTokensNode from './nodes/UiTokensNode';
import ConstantSourceNode from './nodes/ConstantSourceNode';
import MediaStreamNode from './nodes/MediaStreamNode';
import EventTriggerNode from './nodes/EventTriggerNode';
import NoteNode from './nodes/NoteNode';
import { TransportNode } from './nodes/TransportNode';
import { StepSequencerNode } from './nodes/StepSequencerNode';
import { PianoRollNode } from './nodes/PianoRollNode';
import LFONode from './nodes/LFONode';
import { ADSRNode } from './nodes/ADSRNode';
import VoiceNode from './nodes/VoiceNode';
import { SamplerNode } from './nodes/SamplerNode';
import MidiNoteNode from './nodes/MidiNoteNode';
import MidiCCNode from './nodes/MidiCCNode';
import MidiNoteOutputNode from './nodes/MidiNoteOutputNode';
import MidiCCOutputNode from './nodes/MidiCCOutputNode';
import MidiSyncNode from './nodes/MidiSyncNode';
import MidiPlayerNode from './nodes/MidiPlayerNode';
import PatchNode from './nodes/PatchNode';
import MathNode from './nodes/MathNode';
import CompareNode from './nodes/CompareNode';
import MixNode from './nodes/MixNode';
import ClampNode from './nodes/ClampNode';
import SwitchNode from './nodes/SwitchNode';

type EditorNodeFC = ComponentType<NodeProps<Node<AudioNodeData>>>;

/** Full map of editor `data.type` → view; optional keys are omitted from the graph. */
export const EDITOR_NODE_VIEW_BY_TYPE: Partial<Record<EditorNodeType, EditorNodeFC>> = {
    osc: OscNode as unknown as EditorNodeFC,
    gain: GainNode as unknown as EditorNodeFC,
    filter: FilterNode as unknown as EditorNodeFC,
    output: OutputNode as unknown as EditorNodeFC,
    noise: NoiseNode as unknown as EditorNodeFC,
    delay: DelayNode as unknown as EditorNodeFC,
    reverb: ReverbNode as unknown as EditorNodeFC,
    compressor: CompressorNode as unknown as EditorNodeFC,
    phaser: PhaserNode as unknown as EditorNodeFC,
    flanger: FlangerNode as unknown as EditorNodeFC,
    tremolo: TremoloNode as unknown as EditorNodeFC,
    eq3: EQ3Node as unknown as EditorNodeFC,
    distortion: DistortionNode as unknown as EditorNodeFC,
    chorus: ChorusNode as unknown as EditorNodeFC,
    noiseBurst: NoiseBurstNode as unknown as EditorNodeFC,
    waveShaper: WaveShaperNode as unknown as EditorNodeFC,
    convolver: ConvolverNode as unknown as EditorNodeFC,
    analyzer: AnalyzerNode as unknown as EditorNodeFC,
    panner: StereoPannerNode as unknown as EditorNodeFC,
    panner3d: Panner3DNode as unknown as EditorNodeFC,
    mixer: MixerNode as unknown as EditorNodeFC,
    auxSend: AuxSendNode as unknown as EditorNodeFC,
    auxReturn: AuxReturnNode as unknown as EditorNodeFC,
    matrixMixer: MatrixMixerNode as unknown as EditorNodeFC,
    input: InputNode as unknown as EditorNodeFC,
    uiTokens: UiTokensNode as unknown as EditorNodeFC,
    constantSource: ConstantSourceNode as unknown as EditorNodeFC,
    mediaStream: MediaStreamNode as unknown as EditorNodeFC,
    eventTrigger: EventTriggerNode as unknown as EditorNodeFC,
    note: NoteNode as unknown as EditorNodeFC,
    transport: TransportNode as unknown as EditorNodeFC,
    stepSequencer: StepSequencerNode as unknown as EditorNodeFC,
    pianoRoll: PianoRollNode as unknown as EditorNodeFC,
    lfo: LFONode as unknown as EditorNodeFC,
    adsr: ADSRNode as unknown as EditorNodeFC,
    voice: VoiceNode as unknown as EditorNodeFC,
    sampler: SamplerNode as unknown as EditorNodeFC,
    midiNote: MidiNoteNode as unknown as EditorNodeFC,
    midiCC: MidiCCNode as unknown as EditorNodeFC,
    midiNoteOutput: MidiNoteOutputNode as unknown as EditorNodeFC,
    midiCCOutput: MidiCCOutputNode as unknown as EditorNodeFC,
    midiSync: MidiSyncNode as unknown as EditorNodeFC,
    midiPlayer: MidiPlayerNode as unknown as EditorNodeFC,
    patch: PatchNode as unknown as EditorNodeFC,
    math: MathNode as unknown as EditorNodeFC,
    compare: CompareNode as unknown as EditorNodeFC,
    mix: MixNode as unknown as EditorNodeFC,
    clamp: ClampNode as unknown as EditorNodeFC,
    switch: SwitchNode as unknown as EditorNodeFC,
};

/** XYFlow `node.type` string used in persisted graphs (`gain` → `gainNode`). */
export function editorTypeToReactFlowType(editorType: EditorNodeType): string {
    return `${editorType}Node`;
}

/**
 * React Flow `nodeTypes` for every row in the Studio catalog that has a registered view.
 */
export function buildReactFlowNodeTypesFromStudioCatalog(): NodeTypes {
    const out: NodeTypes = {};
    for (const def of loadStudioNodeCatalog()) {
        const editorType = def.name as EditorNodeType;
        const Comp = EDITOR_NODE_VIEW_BY_TYPE[editorType];
        if (!Comp) {
            if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
                // eslint-disable-next-line no-console -- dev-only catalog/view drift signal
                console.warn(`[react-flow] Studio catalog has "${def.name}" but no EDITOR_NODE_VIEW_BY_TYPE entry; graph will not register this type.`);
            }
            continue;
        }
        out[editorTypeToReactFlowType(editorType)] = Comp as NodeTypes[string];
    }
    return out;
}
