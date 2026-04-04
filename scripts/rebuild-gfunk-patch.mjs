import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const patchPath = path.join(__dirname, '../ui/editor/templates/westcoast-gfunk-64.patch.json');

const n = 64;

function buildKick() {
    const vel = {};
    const merge = (s, v) => {
        vel[s] = Math.max(vel[s] ?? 0, v);
    };
    for (const s of [0, 16, 32, 48]) merge(s, 1);
    for (const s of [10, 26, 42, 58]) merge(s, 0.78);
    for (const s of [8, 24, 40, 56]) merge(s, 0.62);
    for (const s of [7, 23, 39, 55]) merge(s, 0.46);
    for (const s of [3, 19, 35, 51]) merge(s, 0.27);
    merge(14, 0.38);
    merge(30, 0.34);
    merge(46, 0.4);
    merge(62, 0.33);
    const pattern = Array.from({ length: n }, (_, i) => vel[i] ?? 0);
    const activeSteps = Array.from({ length: n }, (_, i) => pattern[i] > 0);
    return { pattern, activeSteps };
}

function buildSnare() {
    const vel = {};
    const merge = (s, v) => {
        vel[s] = Math.max(vel[s] ?? 0, v);
    };
    for (let b = 0; b < 4; b += 1) {
        merge(b * 16 + 4, 0.95);
        merge(b * 16 + 12, 0.74);
    }
    for (const s of [6, 22, 38, 54]) merge(s, 0.24);
    merge(61, 0.34);
    merge(62, 0.26);
    merge(63, 0.18);
    const pattern = Array.from({ length: n }, (_, i) => vel[i] ?? 0);
    const activeSteps = Array.from({ length: n }, (_, i) => pattern[i] > 0);
    return { pattern, activeSteps };
}

function buildHatClosed() {
    const pattern = Array.from({ length: n }, (_, i) => 0);
    const activeSteps = Array.from({ length: n }, (_, i) => false);
    for (let i = 0; i < n; i += 1) {
        const ib = i % 16;
        if (ib === 15) continue;
        activeSteps[i] = true;
        if (ib % 4 === 0) pattern[i] = 0.24;
        else if (ib % 4 === 2) pattern[i] = 0.46;
        else if (ib % 2 === 1) pattern[i] = 0.38;
        else pattern[i] = 0.2;
    }
    for (let b = 0; b < 4; b += 1) {
        const s4 = b * 16 + 4;
        const s12 = b * 16 + 12;
        if (activeSteps[s4]) pattern[s4] *= 0.52;
        if (activeSteps[s12]) pattern[s12] *= 0.6;
    }
    return { pattern, activeSteps };
}

function buildHatOpen() {
    const vel = {};
    const merge = (s, v) => {
        vel[s] = Math.max(vel[s] ?? 0, v);
    };
    for (const s of [11, 27, 43, 59]) merge(s, 0.66);
    for (const s of [7, 23, 39, 55]) merge(s, 0.44);
    for (const s of [14, 30, 46]) merge(s, 0.32);
    const pattern = Array.from({ length: n }, (_, i) => vel[i] ?? 0);
    const activeSteps = Array.from({ length: n }, (_, i) => pattern[i] > 0);
    return { pattern, activeSteps };
}

const kick = buildKick();
const snare = buildSnare();
const hat = buildHatClosed();
const hatOpen = buildHatOpen();

const bassNotes = [
    { pitch: 40, step: 0, duration: 2, velocity: 0.84 },
    { pitch: 40, step: 3, duration: 1, velocity: 0.56 },
    { pitch: 43, step: 5, duration: 2, velocity: 0.74 },
    { pitch: 45, step: 9, duration: 2, velocity: 0.7 },
    { pitch: 47, step: 13, duration: 2, velocity: 0.62 },
    { pitch: 40, step: 16, duration: 3, velocity: 0.86 },
    { pitch: 52, step: 20, duration: 1, velocity: 0.58 },
    { pitch: 50, step: 22, duration: 2, velocity: 0.68 },
    { pitch: 47, step: 26, duration: 2, velocity: 0.64 },
    { pitch: 45, step: 30, duration: 1, velocity: 0.52 },
    { pitch: 40, step: 32, duration: 2, velocity: 0.82 },
    { pitch: 43, step: 35, duration: 2, velocity: 0.72 },
    { pitch: 45, step: 40, duration: 2, velocity: 0.76 },
    { pitch: 38, step: 44, duration: 2, velocity: 0.58 },
    { pitch: 40, step: 48, duration: 3, velocity: 0.88 },
    { pitch: 45, step: 52, duration: 1, velocity: 0.6 },
    { pitch: 47, step: 55, duration: 2, velocity: 0.7 },
    { pitch: 40, step: 58, duration: 2, velocity: 0.68 },
    { pitch: 43, step: 61, duration: 2, velocity: 0.62 },
];

const whistleNotes = [
    { pitch: 86, step: 3, duration: 3, velocity: 0.46 },
    { pitch: 88, step: 7, duration: 2, velocity: 0.36 },
    { pitch: 90, step: 11, duration: 4, velocity: 0.5 },
    { pitch: 83, step: 18, duration: 2, velocity: 0.38 },
    { pitch: 86, step: 21, duration: 3, velocity: 0.48 },
    { pitch: 91, step: 27, duration: 5, velocity: 0.52 },
    { pitch: 88, step: 35, duration: 2, velocity: 0.42 },
    { pitch: 93, step: 39, duration: 3, velocity: 0.54 },
    { pitch: 86, step: 45, duration: 2, velocity: 0.44 },
    { pitch: 90, step: 49, duration: 4, velocity: 0.48 },
    { pitch: 95, step: 54, duration: 2, velocity: 0.58 },
    { pitch: 88, step: 57, duration: 3, velocity: 0.4 },
];

const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));

const INSERTED_NODE_IDS = new Set([
    'noise-kick-click',
    'filter-kick-click',
    'gain-kick-click',
    'noise-snare-low',
    'filter-snare-low',
    'gain-snare-low',
    'gain-snare-wire',
    'gain-snare-sum',
    'seq-hat-open',
    'noise-hat-open',
    'filter-hat-open',
    'gain-hat-open',
    'gain-hat-sum',
]);

const OWNED_CONNECTION_IDS = new Set([
    'sqk-click',
    'clk-fi',
    'clk-g',
    'clk-mix',
    'sns-tr-low',
    'snl-fi',
    'snl-g',
    'snl-sum',
    'sns-g2',
    'snw-sum',
    'sns-out2',
    't-hato',
    'hot-tr',
    'hot-fi',
    'hot-g',
    'hot-sum',
    'hat-g2',
    'hat-sum1',
    'hat-out2',
]);

patch.nodes = patch.nodes.filter((nd) => !INSERTED_NODE_IDS.has(nd.id));
patch.connections = patch.connections.filter((c) => {
    if (OWNED_CONNECTION_IDS.has(c.id)) return false;
    if (INSERTED_NODE_IDS.has(c.source) || INSERTED_NODE_IDS.has(c.target)) return false;
    return true;
});

patch.name = 'West Coast GFunk 64 — 808, whistle, bass';

const nodeById = new Map(patch.nodes.map((nd) => [nd.id, nd]));

nodeById.get('transport-1').data.bpm = 90;
nodeById.get('transport-1').data.swing = 0.26;
nodeById.get('transport-1').data.label = 'Transport · 90 · swing';

const sk = nodeById.get('seq-kick');
Object.assign(sk.data, { pattern: kick.pattern, activeSteps: kick.activeSteps, label: '808 kick · pocket' });

const ss = nodeById.get('seq-snare');
Object.assign(ss.data, { pattern: snare.pattern, activeSteps: snare.activeSteps, label: 'Snare · layers' });

const sh = nodeById.get('seq-hat');
Object.assign(sh.data, { pattern: hat.pattern, activeSteps: hat.activeSteps, label: 'Hats closed' });

nodeById.get('piano-whistle').data.notes = whistleNotes;
nodeById.get('piano-bass').data.notes = bassNotes;

nodeById.get('note-kick').data.note = 'G';
nodeById.get('note-kick').data.octave = 1;
nodeById.get('note-kick').data.frequency = 49;
nodeById.get('note-kick').data.label = 'Kick root · G1';

nodeById.get('osc-kick').data.frequency = 49;
nodeById.get('osc-kick').data.label = '808 sub · G1';

const adsrK = nodeById.get('adsr-kick').data;
adsrK.decay = 0.58;
adsrK.release = 0.14;
adsrK.label = 'Kick env · 808 tail';

nodeById.get('noise-snare').data.noiseType = 'white';
nodeById.get('noise-snare').data.duration = 0.085;
nodeById.get('noise-snare').data.gain = 0.92;
nodeById.get('noise-snare').data.release = 0.11;
nodeById.get('noise-snare').data.label = 'Snare crack';

const fSn = nodeById.get('filter-snare').data;
fSn.filterType = 'bandpass';
fSn.frequency = 2850;
fSn.q = 1.05;
fSn.label = 'Snare snap';

nodeById.get('noise-hat').data.duration = 0.032;
nodeById.get('noise-hat').data.gain = 0.4;
nodeById.get('noise-hat').data.release = 0.028;
nodeById.get('noise-hat').data.label = 'Hat · tight';

const fHat = nodeById.get('filter-hat').data;
fHat.frequency = 9800;
fHat.q = 0.72;
fHat.label = 'Hat shine';

nodeById.get('voice-bass').data.portamento = 0.055;

const adsrB = nodeById.get('adsr-bass').data;
adsrB.decay = 0.22;
adsrB.sustain = 0.48;
adsrB.release = 0.28;

const cp = nodeById.get('compressor-duck').data;
cp.threshold = -20;
cp.ratio = 4.8;
cp.sidechainStrength = 0.74;
cp.release = 0.24;
cp.label = 'Kick duck · heavier';

let hatIdx = patch.nodes.findIndex((nd) => nd.id === 'gain-hat');
if (hatIdx < 0) hatIdx = patch.nodes.findIndex((nd) => nd.id === 'gain-hat-ch');
if (hatIdx < 0) throw new Error('gain-hat / gain-hat-ch not found');

if (patch.nodes[hatIdx].id === 'gain-hat') {
    patch.nodes[hatIdx] = {
        ...patch.nodes[hatIdx],
        id: 'gain-hat-ch',
        data: { type: 'gain', gain: 0.78, label: 'Hat closed level' },
    };
} else {
    patch.nodes[hatIdx] = {
        ...patch.nodes[hatIdx],
        data: { type: 'gain', gain: 0.78, label: 'Hat closed level' },
    };
}

const insertAt = hatIdx + 1;
const newNodes = [
    {
        id: 'noise-kick-click',
        type: 'noiseBurst',
        position: { x: 560, y: -340 },
        data: {
            type: 'noiseBurst',
            noiseType: 'white',
            duration: 0.012,
            gain: 0.42,
            attack: 0.0005,
            release: 0.018,
            label: 'Kick click',
        },
    },
    {
        id: 'filter-kick-click',
        type: 'filter',
        position: { x: 690, y: -340 },
        data: {
            type: 'filter',
            filterType: 'bandpass',
            frequency: 4200,
            detune: 0,
            q: 1.8,
            gain: 0,
            label: 'Click focus',
        },
    },
    {
        id: 'gain-kick-click',
        type: 'gain',
        position: { x: 820, y: -340 },
        data: { type: 'gain', gain: 0.58, label: 'Click level' },
    },
    {
        id: 'noise-snare-low',
        type: 'noiseBurst',
        position: { x: 320, y: 90 },
        data: {
            type: 'noiseBurst',
            noiseType: 'pink',
            duration: 0.38,
            gain: 0.68,
            attack: 0.002,
            release: 0.28,
            label: 'Snare body',
        },
    },
    {
        id: 'filter-snare-low',
        type: 'filter',
        position: { x: 560, y: 90 },
        data: {
            type: 'filter',
            filterType: 'bandpass',
            frequency: 320,
            detune: 0,
            q: 1.25,
            gain: 0,
            label: '808 snare thump',
        },
    },
    {
        id: 'gain-snare-low',
        type: 'gain',
        position: { x: 690, y: 90 },
        data: { type: 'gain', gain: 0.52, label: 'Body level' },
    },
    {
        id: 'gain-snare-wire',
        type: 'gain',
        position: { x: 690, y: -40 },
        data: { type: 'gain', gain: 0.88, label: 'Crack level' },
    },
    {
        id: 'gain-snare-sum',
        type: 'gain',
        position: { x: 950, y: 30 },
        data: { type: 'gain', gain: 0.96, label: 'Snare bus' },
    },
    {
        id: 'seq-hat-open',
        type: 'stepSequencer',
        position: { x: 40, y: 260 },
        data: {
            type: 'stepSequencer',
            steps: 64,
            pattern: hatOpen.pattern,
            activeSteps: hatOpen.activeSteps,
            label: 'Hats open',
        },
    },
    {
        id: 'noise-hat-open',
        type: 'noiseBurst',
        position: { x: 320, y: 260 },
        data: {
            type: 'noiseBurst',
            noiseType: 'white',
            duration: 0.14,
            gain: 0.34,
            attack: 0.001,
            release: 0.095,
            label: 'Open hat',
        },
    },
    {
        id: 'filter-hat-open',
        type: 'filter',
        position: { x: 560, y: 260 },
        data: {
            type: 'filter',
            filterType: 'highpass',
            frequency: 5200,
            detune: 0,
            q: 0.55,
            gain: 0,
            label: 'Open air',
        },
    },
    {
        id: 'gain-hat-open',
        type: 'gain',
        position: { x: 690, y: 260 },
        data: { type: 'gain', gain: 0.82, label: 'Open level' },
    },
    {
        id: 'gain-hat-sum',
        type: 'gain',
        position: { x: 950, y: 180 },
        data: { type: 'gain', gain: 0.9, label: 'Hat bus' },
    },
];

patch.nodes.splice(insertAt, 0, ...newNodes);

patch.nodes = patch.nodes.filter((nd) => nd.id !== 'gain-snare');

const con = patch.connections.filter((c) => {
    if (c.id === 'sns-g') return false;
    if (c.id === 'sns-out') return false;
    if (c.id === 'hat-g') return false;
    if (c.id === 'hat-out') return false;
    return true;
});

function add(conn) {
    con.push(conn);
}

add({ id: 'sqk-click', source: 'seq-kick', sourceHandle: 'trigger', target: 'noise-kick-click', targetHandle: 'trigger' });
add({ id: 'clk-fi', source: 'noise-kick-click', sourceHandle: 'out', target: 'filter-kick-click', targetHandle: 'in' });
add({ id: 'clk-g', source: 'filter-kick-click', sourceHandle: 'out', target: 'gain-kick-click', targetHandle: 'in' });
add({ id: 'clk-mix', source: 'gain-kick-click', sourceHandle: 'out', target: 'gain-kick', targetHandle: 'in' });

add({ id: 'sns-tr-low', source: 'seq-snare', sourceHandle: 'trigger', target: 'noise-snare-low', targetHandle: 'trigger' });
add({ id: 'snl-fi', source: 'noise-snare-low', sourceHandle: 'out', target: 'filter-snare-low', targetHandle: 'in' });
add({ id: 'snl-g', source: 'filter-snare-low', sourceHandle: 'out', target: 'gain-snare-low', targetHandle: 'in' });
add({ id: 'snl-sum', source: 'gain-snare-low', sourceHandle: 'out', target: 'gain-snare-sum', targetHandle: 'in' });

add({ id: 'sns-g2', source: 'filter-snare', sourceHandle: 'out', target: 'gain-snare-wire', targetHandle: 'in' });
add({ id: 'snw-sum', source: 'gain-snare-wire', sourceHandle: 'out', target: 'gain-snare-sum', targetHandle: 'in' });
add({ id: 'sns-out2', source: 'gain-snare-sum', sourceHandle: 'out', target: 'output-1', targetHandle: 'in' });

add({ id: 't-hato', source: 'transport-1', sourceHandle: 'out', target: 'seq-hat-open', targetHandle: 'transport' });
add({ id: 'hot-tr', source: 'seq-hat-open', sourceHandle: 'trigger', target: 'noise-hat-open', targetHandle: 'trigger' });
add({ id: 'hot-fi', source: 'noise-hat-open', sourceHandle: 'out', target: 'filter-hat-open', targetHandle: 'in' });
add({ id: 'hot-g', source: 'filter-hat-open', sourceHandle: 'out', target: 'gain-hat-open', targetHandle: 'in' });
add({ id: 'hot-sum', source: 'gain-hat-open', sourceHandle: 'out', target: 'gain-hat-sum', targetHandle: 'in' });

add({ id: 'hat-g2', source: 'filter-hat', sourceHandle: 'out', target: 'gain-hat-ch', targetHandle: 'in' });
add({ id: 'hat-sum1', source: 'gain-hat-ch', sourceHandle: 'out', target: 'gain-hat-sum', targetHandle: 'in' });
add({ id: 'hat-out2', source: 'gain-hat-sum', sourceHandle: 'out', target: 'output-1', targetHandle: 'in' });

patch.connections = con;

fs.writeFileSync(patchPath, JSON.stringify(patch, null, 2) + '\n');
