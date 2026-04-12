/**
 * One-shot: merge palette metadata into built-in node YAML files.
 * Run from repo root: node ./scripts/patch-built-in-node-metadata.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const globDir = path.join(root, 'ui/editor/built-in-nodes');

/** @type {Record<string, { color: string; icon: string; singleton?: boolean }>} */
const META = {
    input: { color: '#dddddd', icon: '⏱️' },
    uiTokens: { color: '#68a5ff', icon: '⏱️' },
    eventTrigger: { color: '#ffd166', icon: '⚡' },
    transport: { color: '#dddddd', icon: '⏯️', singleton: true },
    stepSequencer: { color: '#dddddd', icon: '🎹' },
    pianoRoll: { color: '#44ccff', icon: '🎼' },
    lfo: { color: '#aa44ff', icon: '🌀' },
    constantSource: { color: '#7bd1ff', icon: '━' },
    mediaStream: { color: '#7bd1ff', icon: '🎙️' },
    patch: { color: '#7bd1ff', icon: '🧩' },
    voice: { color: '#ff4466', icon: '🗣️' },
    adsr: { color: '#dddddd', icon: '📈' },
    note: { color: '#ffcc00', icon: '🎵' },
    osc: { color: '#ff8844', icon: '◐' },
    noise: { color: '#888888', icon: '〰️' },
    noiseBurst: { color: '#888888', icon: '💥' },
    sampler: { color: '#44ccff', icon: '🎹' },
    midiNote: { color: '#4dd4a0', icon: '🎹' },
    midiCC: { color: '#4dd4a0', icon: '🎛️' },
    midiNoteOutput: { color: '#4dd4a0', icon: '📤' },
    midiCCOutput: { color: '#4dd4a0', icon: '📤' },
    midiSync: { color: '#4dd4a0', icon: '⏱️', singleton: true },
    midiPlayer: { color: '#4dd4a0', icon: '🎵' },
    gain: { color: '#44cc44', icon: '◧' },
    filter: { color: '#aa44ff', icon: '◇' },
    compressor: { color: '#44cc44', icon: '🗜️' },
    delay: { color: '#4488ff', icon: '⏱️' },
    reverb: { color: '#8844ff', icon: '🏛️' },
    phaser: { color: '#7a9cff', icon: '🌀' },
    flanger: { color: '#7a9cff', icon: '🧵' },
    tremolo: { color: '#7a9cff', icon: '〰️' },
    eq3: { color: '#7a9cff', icon: '🎚️' },
    distortion: { color: '#ff7f50', icon: '🔥' },
    chorus: { color: '#44ccff', icon: '🌊' },
    waveShaper: { color: '#ff7f50', icon: '∿' },
    convolver: { color: '#8844ff', icon: '🧱' },
    analyzer: { color: '#7bd1ff', icon: '📊' },
    panner: { color: '#44ffff', icon: '↔️' },
    panner3d: { color: '#44ffff', icon: '🧭' },
    mixer: { color: '#ffaa44', icon: '⊕' },
    auxSend: { color: '#ffaa44', icon: '↗️' },
    auxReturn: { color: '#ffaa44', icon: '↘️' },
    matrixMixer: { color: '#ffaa44', icon: '▦' },
    output: { color: '#ff4466', icon: '🔊', singleton: true },
    math: { color: '#7bd1ff', icon: 'fx' },
    compare: { color: '#7bd1ff', icon: '>=' },
    mix: { color: '#7bd1ff', icon: 'mix' },
    clamp: { color: '#7bd1ff', icon: '[]' },
    switch: { color: '#7bd1ff', icon: 'sw' },
};

function walkYamlFiles(dir, out = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walkYamlFiles(p, out);
        else if (ent.name.endsWith('.yaml') || ent.name.endsWith('.yml')) out.push(p);
    }
    return out;
}

/**
 * @param {import('yaml').Document} doc
 * @param {string} key
 */
function isYamlMap(node) {
    return Boolean(node && typeof node === 'object' && Array.isArray(node.items));
}

function removeKey(doc, key) {
    const rootMap = doc.contents;
    if (!isYamlMap(rootMap)) return;
    const items = rootMap.items;
    const idx = items.findIndex((i) => i.key?.value === key);
    if (idx !== -1) items.splice(idx, 1);
}

/**
 * @param {import('yaml').Document} doc
 * @param {{ color: string; icon: string; singleton?: boolean }} m
 */
function applyMetadata(doc, m) {
    const rootMap = doc.contents;
    if (!isYamlMap(rootMap)) {
        throw new Error('expected root map');
    }
    removeKey(doc, 'color');
    removeKey(doc, 'icon');
    removeKey(doc, 'singleton');
    const items = rootMap.items;
    const nameIdx = items.findIndex((i) => i.key?.value === 'name');
    if (nameIdx === -1) {
        throw new Error('no name key');
    }
    const pairs = [
        doc.createPair('color', m.color),
        doc.createPair('icon', m.icon),
    ];
    if (m.singleton) {
        pairs.push(doc.createPair('singleton', true));
    }
    let at = nameIdx;
    for (const p of pairs) {
        at += 1;
        items.splice(at, 0, p);
    }
}

for (const file of walkYamlFiles(globDir)) {
    const text = fs.readFileSync(file, 'utf8');
    const doc = parseDocument(text);
    const name = doc.get('name');
    if (typeof name !== 'string') {
        throw new Error(`Missing name in ${file}`);
    }
    const m = META[name];
    if (!m) {
        console.warn(`[patch] no META for "${name}" in ${path.relative(root, file)}`);
        continue;
    }
    applyMetadata(doc, m);
    fs.writeFileSync(file, String(doc), 'utf8');
    console.log('patched', path.relative(root, file));
}
