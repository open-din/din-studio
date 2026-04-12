/**
 * useFaustDsp — live Faust DSP runtime hook.
 *
 * Behaviour:
 *  - When `playing` is false → disconnect any live Faust node immediately, go idle.
 *  - When `playing` is true and nodes/edges change → debounce 400 ms → recompile
 *    → atomically swap the AudioWorkletNode connected to audioContext.destination.
 *
 * Only compiles when an AudioContext is available (i.e. after the user has
 * triggered playback at least once).  If the extracted DSP subgraph is empty
 * (unsupported node types or disconnected chain), compilation is silently skipped.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import type { IFaustMonoWebAudioNode } from '@grame/faustwasm';
import type { AudioNodeData } from '../types';
import { buildFaustBundleFromGraph } from './graphFaustPipeline';
import { getFaustRuntime } from './faustBrowserRuntime';
import { audioEngine } from '../AudioEngine';

export type FaustDspStatus = 'idle' | 'compiling' | 'live' | 'error';

export interface FaustDspState {
    status: FaustDspStatus;
    error: string | null;
}

const DEBOUNCE_MS = 400;

export function useFaustDsp(
    nodes: Node<AudioNodeData>[],
    edges: Edge[],
    /** Pass `audioEngine.getContext()` — null until user triggers playback. */
    getAudioContext: () => AudioContext | null,
    /** Mirror of the output node's `playing` flag — drives start/stop. */
    playing: boolean,
): FaustDspState {
    const [state, setState] = useState<FaustDspState>({ status: 'idle', error: null });

    const liveNodeRef = useRef<IFaustMonoWebAudioNode | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Monotonically-increasing version — cancels stale async compile results.
    const versionRef = useRef(0);

    // ── Activate Faust mode for the lifetime of this hook ─────────────────────
    // Tells AudioEngine.start() to skip the Web Audio graph so the Faust
    // AudioWorkletNode is the sole audio path. useLayoutEffect runs before
    // paint so start() cannot build a WA graph before faustMode is set.
    useLayoutEffect(() => {
        audioEngine.setFaustMode(true);
        return () => {
            audioEngine.setFaustMode(false);
        };
    }, []);

    // ── Stop immediately when playback is paused/stopped ──────────────────────
    useEffect(() => {
        if (!playing) {
            // Cancel any in-flight debounce or compilation.
            if (debounceRef.current !== null) {
                clearTimeout(debounceRef.current);
                debounceRef.current = null;
            }
            ++versionRef.current; // invalidate any in-flight async compile

            liveNodeRef.current?.disconnect();
            liveNodeRef.current = null;
            audioEngine.attachFaustDsp(null, null);
            setState({ status: 'idle', error: null });
        }
    }, [playing]);

    // ── Compile / hot-reload whenever the graph changes while playing ─────────
    useEffect(() => {
        if (!playing) return; // guard: stop effect handles the false→idle transition

        if (debounceRef.current !== null) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(async () => {
            const ctx = getAudioContext();
            if (!ctx) return; // AudioContext not yet created — wait for first play.

            // Generate Faust code from the current graph.
            const bundle = buildFaustBundleFromGraph(nodes, edges, 'din-studio');

            // Skip if nothing compilable (unsupported node types or empty chain).
            if (!bundle.faust) {
                liveNodeRef.current?.disconnect();
                liveNodeRef.current = null;
                audioEngine.attachFaustDsp(null, null);
                return;
            }

            const thisVersion = ++versionRef.current;
            setState({ status: 'compiling', error: null });

            try {
                // Lazy-load the WASM runtime (heavy, ~17 MB — cached after first load).
                const { compiler, generator } = await getFaustRuntime();
                if (thisVersion !== versionRef.current) return;

                // Compile Faust source to a DSP factory.
                console.log('[dsp source]', bundle.faust);
                const result = await generator.compile(
                    compiler,
                    `din_${thisVersion}`,
                    bundle.faust,
                    '-O1',
                );
                if (thisVersion !== versionRef.current) return;

                const factory = result?.factory;
                if (!factory) {
                    throw new Error(compiler.getErrorMessage() || 'Faust compile failed');
                }

                // Ensure the context is running before connecting.
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }
                if (thisVersion !== versionRef.current) return;

                // Create the AudioWorklet node from the compiled factory.
                // Unique processorName per version avoids the
                // "AudioWorklet processor already registered" error on hot-reload.
                const newNode = await generator.createNode(
                    ctx,
                    `din_${thisVersion}`,
                    factory,
                    false,         // sp = false → AudioWorkletNode (preferred)
                    undefined,     // bufferSize (AudioWorklet always uses 128 frames)
                    `din-faust-${thisVersion}`,
                );
                if (thisVersion !== versionRef.current) {
                    newNode?.disconnect();
                    return;
                }

                if (!newNode) {
                    throw new Error('FaustMonoDspGenerator.createNode returned null');
                }

                // Atomic swap: disconnect old → connect new.
                liveNodeRef.current?.disconnect();
                newNode.connect(ctx.destination);
                liveNodeRef.current = newNode;

                audioEngine.attachFaustDsp(newNode, bundle.manifest);
                audioEngine.syncFaustParamsFromGraph(nodes);

                setState({ status: 'live', error: null });
            } catch (err) {
                if (thisVersion !== versionRef.current) return;
                audioEngine.attachFaustDsp(null, null);
                setState({
                    status: 'error',
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current !== null) {
                clearTimeout(debounceRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges, playing]);

    // ── Disconnect on unmount ─────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            liveNodeRef.current?.disconnect();
            liveNodeRef.current = null;
            audioEngine.attachFaustDsp(null, null);
        };
    }, []);

    return state;
}
