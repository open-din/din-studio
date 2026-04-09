import { DEFAULT_HANDLES_BY_TYPE, EDITOR_NODE_CATALOG, NODE_CATEGORY_ORDER } from './data';
import type { EditorNodeType, NodeCatalogEntry } from './types';

export function getNodeCatalogEntry(type: EditorNodeType): NodeCatalogEntry {
    const entry = EDITOR_NODE_CATALOG.find((item) => item.type === type);
    if (!entry) {
        throw new Error(`Unknown editor node type: ${type}`);
    }
    return entry;
}

export function groupCatalogByCategory() {
    return NODE_CATEGORY_ORDER.map((category) => ({
        name: category,
        nodes: EDITOR_NODE_CATALOG.filter((node) => node.category === category),
    }));
}

export function buildAgentNodeCatalogMarkdown(): string {
    const lines: string[] = [];
    for (const category of NODE_CATEGORY_ORDER) {
        lines.push(`### ${category}`);
        const nodes = EDITOR_NODE_CATALOG.filter((n) => n.category === category);
        for (const entry of nodes) {
            const singleton = entry.singleton ? ' **Singleton** (one per graph; reuse existing id from snapshot).' : '';

            let ports: string;
            if (entry.type === 'input') {
                ports = '**Source** handles per exposed param: `param:<paramId>` (see snapshot / Input node data).';
            } else if (entry.type === 'uiTokens') {
                ports = '**Source** handles per bound UI token.';
            } else if (entry.type === 'math') {
                ports = '**out** (source). Targets **a** / **b** / **c** depend on `data.operation` (see Math node).';
            } else if (entry.type === 'switch') {
                ports = '**out** (source). Targets **index**, **in_0…in_k** where k = `data.inputs` − 1 (2–8).';
            } else if (entry.type === 'matrixMixer') {
                ports = '**in1…**, **out**, **out1…**, plus **cell:row:col** gains; counts from `data.inputs` / `data.outputs`.';
            } else if (entry.type === 'patch') {
                ports = 'Implicit audio handles: `in` / `out`; dynamic boundary handles from source metadata: `in:<slotId>` and `out:<slotId>`.';
            } else if (entry.type === 'stepSequencer') {
                const handles = DEFAULT_HANDLES_BY_TYPE.stepSequencer;
                const sources = handles.filter((h) => h.direction === 'source').map((h) => `\`${h.id}\``);
                const targets = handles.filter((h) => h.direction === 'target').map((h) => `\`${h.id}\``);
                ports = `Sources: ${sources.join(', ')}. Targets: ${targets.join(', ')}. **Data**: \`steps\`, \`pattern\` (number[] 0–1), \`activeSteps\` (boolean[] — **defaults all false; set true on steps that should fire**).`;
            } else if (entry.type === 'pianoRoll') {
                const handles = DEFAULT_HANDLES_BY_TYPE.pianoRoll;
                const sources = handles.filter((h) => h.direction === 'source').map((h) => `\`${h.id}\``);
                const targets = handles.filter((h) => h.direction === 'target').map((h) => `\`${h.id}\``);
                ports = `Sources: ${sources.join(', ')}. Targets: ${targets.join(', ')}. **Data**: \`steps\`, \`octaves\`, \`baseNote\` (MIDI), \`notes\`: [\`{ pitch, step, duration, velocity }\`] (**defaults empty — add notes for melody**).`;
            } else {
                const handles = DEFAULT_HANDLES_BY_TYPE[entry.type];
                if (handles.length === 0) {
                    ports = 'No graph ports; editor-level MIDI/sync behavior.';
                } else {
                    const sources = handles.filter((h) => h.direction === 'source').map((h) => `\`${h.id}\``);
                    const targets = handles.filter((h) => h.direction === 'target').map((h) => `\`${h.id}\``);
                    ports = `Sources: ${sources.length ? sources.join(', ') : '—'}. Targets: ${targets.length ? targets.join(', ') : '—'}.`;
                }
            }

            lines.push(`- \`${entry.type}\` — ${entry.label}.${singleton} ${ports}`);
        }
        lines.push('');
    }
    return lines.join('\n').trimEnd();
}
