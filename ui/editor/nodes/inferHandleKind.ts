import type { AudioNodeData } from '../types';
import type { NodeHandleKind } from '../components/NodeShell';

/**
 * Match legacy StandardNodes handle styling for graph edges.
 */
export function inferHandleKind(
    nodeType: AudioNodeData['type'],
    handleId: string,
    direction: 'source' | 'target',
): NodeHandleKind {
    if (handleId === 'trigger' || handleId === 'gate' || handleId === 'transport') {
        return 'trigger';
    }

    if (
        nodeType === 'mixer'
        || nodeType === 'osc'
        || nodeType === 'noise'
        || nodeType === 'filter'
        || nodeType === 'delay'
        || nodeType === 'reverb'
        || nodeType === 'compressor'
        || nodeType === 'phaser'
        || nodeType === 'flanger'
        || nodeType === 'tremolo'
        || nodeType === 'eq3'
        || nodeType === 'distortion'
        || nodeType === 'chorus'
        || nodeType === 'waveShaper'
        || nodeType === 'convolver'
        || nodeType === 'analyzer'
        || nodeType === 'panner'
        || nodeType === 'panner3d'
        || nodeType === 'auxSend'
        || nodeType === 'auxReturn'
        || nodeType === 'output'
        || nodeType === 'mediaStream'
        || nodeType === 'sampler'
    ) {
        if (
            handleId === 'in'
            || handleId === 'out'
            || handleId === 'sidechainIn'
            || /^in\d+$/.test(handleId)
            || /^out\d+$/.test(handleId)
        ) {
            return 'audio';
        }
    }

    if (direction === 'source' && nodeType === 'input') return 'control';
    if (direction === 'source' && nodeType === 'uiTokens') return 'control';
    if (direction === 'source' && nodeType === 'note') return 'control';
    if (direction === 'source' && nodeType === 'constantSource') return 'control';
    if (direction === 'source' && nodeType === 'lfo') return 'control';
    if (direction === 'source' && nodeType === 'adsr') return 'control';
    if (direction === 'source' && nodeType === 'voice') return handleId === 'gate' ? 'trigger' : 'control';
    if (direction === 'source' && nodeType === 'midiNote') return handleId === 'trigger' || handleId === 'gate' ? 'trigger' : 'control';
    if (direction === 'source' && nodeType === 'midiCC') return 'control';
    if (direction === 'source' && nodeType === 'transport') return 'trigger';
    if (direction === 'source' && nodeType === 'eventTrigger') return 'trigger';
    if (nodeType === 'math' || nodeType === 'compare' || nodeType === 'mix' || nodeType === 'clamp' || nodeType === 'switch') {
        return 'control';
    }

    return 'control';
}
