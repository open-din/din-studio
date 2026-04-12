/**
 * Worker entry: compile Faust DSP off the main thread (`v2/specs/10-runtime-bridge.md`).
 */
import { compileFaustDspToWasm } from '../ui/editor/faust/faustCompile';

export type FaustWorkerRequest = {
    id: string;
    name: string;
    dspCode: string;
};

export type FaustWorkerResponse =
    | { id: string; ok: true; dspJson: string }
    | { id: string; ok: false; error: string };

self.onmessage = async (ev: MessageEvent<FaustWorkerRequest>) => {
    const { id, name, dspCode } = ev.data;
    const result = await compileFaustDspToWasm(name, dspCode);
    if (result.ok) {
        const out: FaustWorkerResponse = { id, ok: true, dspJson: result.dspJson };
        (self as unknown as Worker).postMessage(out);
    } else {
        const out: FaustWorkerResponse = { id, ok: false, error: result.error };
        (self as unknown as Worker).postMessage(out);
    }
};
