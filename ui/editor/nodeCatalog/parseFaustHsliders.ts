/**
 * Extract `hslider("label", default, min, max, step)` widgets from Faust source for catalog hints.
 */

export interface ParsedFaustHslider {
    /** First argument to hslider (may be a path like v/group/param). */
    label: string;
    default: number;
    min: number;
    max: number;
    step: number;
}

/**
 * Parse all `hslider("…", def, min, max, step)` occurrences. Keys are the full label string
 * plus, when the label contains `/`, the last path segment (e.g. `v/n_osc/frequency` → also `frequency`).
 */
export function parseFaustHsliders(dsp: string): Map<string, ParsedFaustHslider> {
    const out = new Map<string, ParsedFaustHslider>();
    const re =
        /hslider\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*,\s*([-+eE0-9.]+)\s*,\s*([-+eE0-9.]+)\s*,\s*([-+eE0-9.]+)\s*,\s*([-+eE0-9.]+)\s*\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(dsp)) !== null) {
        const labelRaw = m[1].replace(/\\"/g, '"');
        const def = Number(m[2]);
        const min = Number(m[3]);
        const max = Number(m[4]);
        const step = Number(m[5]);
        if (![def, min, max, step].every(Number.isFinite)) continue;
        const meta: ParsedFaustHslider = { label: labelRaw, default: def, min, max, step };
        const keys = keysForHsliderLabel(labelRaw);
        for (const k of keys) {
            out.set(k, meta);
        }
    }
    return out;
}

function keysForHsliderLabel(label: string): string[] {
    const keys = new Set<string>();
    keys.add(label);
    if (label.includes('/')) {
        const tail = label.split('/').pop();
        if (tail) keys.add(tail);
    }
    return [...keys];
}

export function findHsliderForPortName(
    sliders: Map<string, ParsedFaustHslider>,
    portName: string,
): ParsedFaustHslider | undefined {
    const direct = sliders.get(portName);
    if (direct) return direct;
    for (const [key, meta] of sliders) {
        if (key === portName) return meta;
        const tail = key.includes('/') ? key.split('/').pop() : key;
        if (tail === portName) return meta;
    }
    return undefined;
}
