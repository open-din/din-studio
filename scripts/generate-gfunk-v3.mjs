import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const patchPath = path.join(__dirname, '../ui/editor/templates/westcoast-gfunk-64.patch.json');

const nodes = [];
const connections = [];

function addNode(id, type, x, y, data) {
    nodes.push({ id, type, position: { x, y }, data: { type, ...data } });
}

function connect(id, source, sourceHandle, target, targetHandle) {
    connections.push({ id, source, sourceHandle, target, targetHandle });
}

// Transport
addNode('transport-1', 'transport', -200, 200, {
    bpm: 92, playing: false, beatsPerBar: 4, beatUnit: 4, stepsPerBeat: 4, barsPerPhrase: 4, swing: 0.18, label: 'Transport · 92 BPM · 16ths'
});

// --- DRUMS ---
// Kick
const kickPattern = new Array(64).fill(0);
const kickActive = new Array(64).fill(false);
[0, 9, 14, 16, 26, 30, 32, 41, 46, 48, 58, 61].forEach(s => {
    kickPattern[s] = 0.85; kickActive[s] = true;
});
addNode('seq-kick', 'stepSequencer', 40, -300, { steps: 64, pattern: kickPattern, activeSteps: kickActive, label: 'Kick Seq' });
connect('tk', 'transport-1', 'out', 'seq-kick', 'transport');

addNode('voice-kick', 'voice', 300, -300, { portamento: 0, label: 'Kick Voice' });
addNode('note-kick', 'note', 300, -200, { note: 'G', octave: 1, frequency: 49, label: 'Kick Pitch' });
addNode('osc-kick', 'osc', 500, -300, { frequency: 49, detune: 0, waveform: 'sine', label: '808 Sub' });
addNode('adsr-kick', 'adsr', 500, -150, { attack: 0.001, decay: 0.6, sustain: 0, release: 0.2, label: '808 Env' });
addNode('gain-kick-sub', 'gain', 700, -300, { gain: 0, label: 'Sub Level' });

connect('sk-vk', 'seq-kick', 'trigger', 'voice-kick', 'trigger');
connect('vk-ak', 'voice-kick', 'gate', 'adsr-kick', 'gate');
connect('nk-ok', 'note-kick', 'freq', 'osc-kick', 'frequency');
connect('ak-gk', 'adsr-kick', 'envelope', 'gain-kick-sub', 'gain');
connect('ok-gk', 'osc-kick', 'out', 'gain-kick-sub', 'in');

addNode('noise-kick', 'noiseBurst', 300, -450, { noiseType: 'white', duration: 0.015, gain: 0.5, attack: 0.001, release: 0.01, label: 'Kick Click' });
addNode('filter-kick', 'filter', 500, -450, { filterType: 'bandpass', frequency: 3500, detune: 0, q: 1.5, gain: 0, label: 'Click Tone' });
addNode('gain-kick-click', 'gain', 700, -450, { gain: 0.6, label: 'Click Level' });

connect('sk-nk', 'seq-kick', 'trigger', 'noise-kick', 'trigger');
connect('nk-fk', 'noise-kick', 'out', 'filter-kick', 'in');
connect('fk-gkc', 'filter-kick', 'out', 'gain-kick-click', 'in');

addNode('gain-kick-sum', 'gain', 900, -350, { gain: 0.9, label: 'Kick Bus' });
connect('gks-sum1', 'gain-kick-sub', 'out', 'gain-kick-sum', 'in');
connect('gkc-sum2', 'gain-kick-click', 'out', 'gain-kick-sum', 'in');

// Snare
const snarePattern = new Array(64).fill(0);
const snareActive = new Array(64).fill(false);
[4, 12, 20, 28, 36, 44, 52, 60].forEach(s => { snarePattern[s] = 0.95; snareActive[s] = true; });
[15, 31, 47, 63].forEach(s => { snarePattern[s] = 0.3; snareActive[s] = true; }); // ghosts
addNode('seq-snare', 'stepSequencer', 40, -50, { steps: 64, pattern: snarePattern, activeSteps: snareActive, label: 'Snare Seq' });
connect('ts', 'transport-1', 'out', 'seq-snare', 'transport');

addNode('noise-snare-body', 'noiseBurst', 300, -50, { noiseType: 'pink', duration: 0.25, gain: 0.8, attack: 0.002, release: 0.2, label: 'Snare Body' });
addNode('filter-snare-body', 'filter', 500, -50, { filterType: 'bandpass', frequency: 250, detune: 0, q: 1.2, gain: 0, label: 'Body Tone' });
addNode('gain-snare-body', 'gain', 700, -50, { gain: 0.6, label: 'Body Level' });

addNode('noise-snare-crack', 'noiseBurst', 300, 100, { noiseType: 'white', duration: 0.1, gain: 0.9, attack: 0.001, release: 0.08, label: 'Snare Crack' });
addNode('filter-snare-crack', 'filter', 500, 100, { filterType: 'bandpass', frequency: 3200, detune: 0, q: 0.8, gain: 0, label: 'Crack Tone' });
addNode('gain-snare-crack', 'gain', 700, 100, { gain: 0.7, label: 'Crack Level' });

addNode('gain-snare-sum', 'gain', 900, 25, { gain: 0.9, label: 'Snare Bus' });

connect('ss-nsb', 'seq-snare', 'trigger', 'noise-snare-body', 'trigger');
connect('nsb-fsb', 'noise-snare-body', 'out', 'filter-snare-body', 'in');
connect('fsb-gsb', 'filter-snare-body', 'out', 'gain-snare-body', 'in');
connect('gsb-sum', 'gain-snare-body', 'out', 'gain-snare-sum', 'in');

connect('ss-nsc', 'seq-snare', 'trigger', 'noise-snare-crack', 'trigger');
connect('nsc-fsc', 'noise-snare-crack', 'out', 'filter-snare-crack', 'in');
connect('fsc-gsc', 'filter-snare-crack', 'out', 'gain-snare-crack', 'in');
connect('gsc-sum', 'gain-snare-crack', 'out', 'gain-snare-sum', 'in');

// Hats
const hatPattern = new Array(64).fill(0);
const hatActive = new Array(64).fill(false);
for(let i=0; i<64; i++) {
    if (i % 4 !== 2) {
        hatPattern[i] = i % 2 === 0 ? 0.6 : 0.3;
        hatActive[i] = true;
    }
}
addNode('seq-hat', 'stepSequencer', 40, 250, { steps: 64, pattern: hatPattern, activeSteps: hatActive, label: 'Hat Seq' });
connect('th', 'transport-1', 'out', 'seq-hat', 'transport');

addNode('noise-hat', 'noiseBurst', 300, 250, { noiseType: 'white', duration: 0.04, gain: 0.5, attack: 0.001, release: 0.03, label: 'Hat Noise' });
addNode('filter-hat', 'filter', 500, 250, { filterType: 'highpass', frequency: 8000, detune: 0, q: 0.7, gain: 0, label: 'Hat Tone' });
addNode('gain-hat', 'gain', 700, 250, { gain: 0.7, label: 'Hat Level' });

connect('sh-nh', 'seq-hat', 'trigger', 'noise-hat', 'trigger');
connect('nh-fh', 'noise-hat', 'out', 'filter-hat', 'in');
connect('fh-gh', 'filter-hat', 'out', 'gain-hat', 'in');

// Open Hat
const ohatPattern = new Array(64).fill(0);
const ohatActive = new Array(64).fill(false);
[2, 10, 18, 26, 34, 42, 50, 58].forEach(s => { ohatPattern[s] = 0.7; ohatActive[s] = true; });
addNode('seq-ohat', 'stepSequencer', 40, 400, { steps: 64, pattern: ohatPattern, activeSteps: ohatActive, label: 'Open Hat Seq' });
connect('toh', 'transport-1', 'out', 'seq-ohat', 'transport');

addNode('noise-ohat', 'noiseBurst', 300, 400, { noiseType: 'white', duration: 0.2, gain: 0.6, attack: 0.002, release: 0.15, label: 'Open Hat Noise' });
addNode('filter-ohat', 'filter', 500, 400, { filterType: 'highpass', frequency: 6000, detune: 0, q: 0.8, gain: 0, label: 'Open Hat Tone' });
addNode('gain-ohat', 'gain', 700, 400, { gain: 0.8, label: 'Open Hat Level' });

connect('soh-noh', 'seq-ohat', 'trigger', 'noise-ohat', 'trigger');
connect('noh-foh', 'noise-ohat', 'out', 'filter-ohat', 'in');
connect('foh-goh', 'filter-ohat', 'out', 'gain-ohat', 'in');

addNode('gain-drums-sum', 'gain', 1100, -100, { gain: 0.9, label: 'Drums Bus' });
connect('gks-ds', 'gain-kick-sum', 'out', 'gain-drums-sum', 'in');
connect('gss-ds', 'gain-snare-sum', 'out', 'gain-drums-sum', 'in');
connect('gh-ds', 'gain-hat', 'out', 'gain-drums-sum', 'in');
connect('goh-ds', 'gain-ohat', 'out', 'gain-drums-sum', 'in');

// --- BASS ---
const bassNotes = [
    { pitch: 43, step: 0, duration: 2, velocity: 0.9 },
    { pitch: 43, step: 3, duration: 1, velocity: 0.6 },
    { pitch: 41, step: 6, duration: 2, velocity: 0.7 },
    { pitch: 43, step: 9, duration: 2, velocity: 0.8 },
    { pitch: 46, step: 12, duration: 2, velocity: 0.8 },
    { pitch: 48, step: 14, duration: 2, velocity: 0.8 },

    { pitch: 43, step: 16, duration: 2, velocity: 0.9 },
    { pitch: 43, step: 19, duration: 1, velocity: 0.6 },
    { pitch: 50, step: 22, duration: 2, velocity: 0.8 },
    { pitch: 48, step: 26, duration: 2, velocity: 0.8 },
    { pitch: 46, step: 30, duration: 2, velocity: 0.8 },

    { pitch: 43, step: 32, duration: 2, velocity: 0.9 },
    { pitch: 43, step: 35, duration: 1, velocity: 0.6 },
    { pitch: 41, step: 38, duration: 2, velocity: 0.7 },
    { pitch: 43, step: 41, duration: 2, velocity: 0.8 },
    { pitch: 46, step: 44, duration: 2, velocity: 0.8 },
    { pitch: 48, step: 46, duration: 2, velocity: 0.8 },

    { pitch: 51, step: 48, duration: 4, velocity: 0.9 },
    { pitch: 50, step: 54, duration: 2, velocity: 0.8 },
    { pitch: 48, step: 58, duration: 2, velocity: 0.8 },
    { pitch: 46, step: 62, duration: 2, velocity: 0.8 },
];
addNode('piano-bass', 'pianoRoll', 40, 600, { steps: 64, octaves: 3, baseNote: 36, notes: bassNotes, label: 'Bass Line' });
connect('tb', 'transport-1', 'out', 'piano-bass', 'transport');

addNode('voice-bass', 'voice', 300, 600, { portamento: 0.08, label: 'Bass Voice' });
addNode('adsr-bass', 'adsr', 500, 750, { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.2, label: 'Bass Env' });
addNode('osc-bass-saw', 'osc', 500, 550, { frequency: 110, waveform: 'sawtooth', detune: 0, label: 'Bass Saw' });
addNode('osc-bass-sub', 'osc', 500, 650, { frequency: 110, waveform: 'sine', detune: 0, label: 'Bass Sub' });
addNode('gain-bass-saw', 'gain', 700, 550, { gain: 0.6, label: 'Saw Level' });
addNode('gain-bass-sub', 'gain', 700, 650, { gain: 0.8, label: 'Sub Level' });
addNode('gain-bass-sum', 'gain', 900, 600, { gain: 1.0, label: 'Bass Mix' });
addNode('filter-bass', 'filter', 1100, 600, { filterType: 'lowpass', frequency: 600, detune: 0, q: 1.5, gain: 0, label: 'Bass Filter' });
addNode('gain-bass-out', 'gain', 1300, 600, { gain: 0, label: 'Bass Amp' });

connect('pb-vb', 'piano-bass', 'trigger', 'voice-bass', 'trigger');
connect('vb-ab', 'voice-bass', 'gate', 'adsr-bass', 'gate');
connect('vb-obs', 'voice-bass', 'note', 'osc-bass-saw', 'frequency');
connect('vb-obsu', 'voice-bass', 'note', 'osc-bass-sub', 'frequency');
connect('obs-gbs', 'osc-bass-saw', 'out', 'gain-bass-saw', 'in');
connect('obsu-gbsu', 'osc-bass-sub', 'out', 'gain-bass-sub', 'in');
connect('gbs-gbsum', 'gain-bass-saw', 'out', 'gain-bass-sum', 'in');
connect('gbsu-gbsum', 'gain-bass-sub', 'out', 'gain-bass-sum', 'in');
connect('gbsum-fb', 'gain-bass-sum', 'out', 'filter-bass', 'in');
connect('fb-gbo', 'filter-bass', 'out', 'gain-bass-out', 'in');
connect('ab-gbo', 'adsr-bass', 'envelope', 'gain-bass-out', 'gain');

// --- BRASS STABS ---
const brassNotes = [
    { pitch: 55, step: 0, duration: 2, velocity: 0.8 },
    { pitch: 53, step: 10, duration: 2, velocity: 0.7 },
    { pitch: 55, step: 16, duration: 2, velocity: 0.8 },
    { pitch: 58, step: 26, duration: 2, velocity: 0.7 },
    { pitch: 55, step: 32, duration: 2, velocity: 0.8 },
    { pitch: 53, step: 42, duration: 2, velocity: 0.7 },
    { pitch: 51, step: 48, duration: 2, velocity: 0.8 },
    { pitch: 50, step: 58, duration: 2, velocity: 0.7 },
];
addNode('piano-brass', 'pianoRoll', 40, 900, { steps: 64, octaves: 3, baseNote: 48, notes: brassNotes, label: 'Brass Stabs' });
connect('tbr', 'transport-1', 'out', 'piano-brass', 'transport');

addNode('voice-brass', 'voice', 300, 900, { portamento: 0, label: 'Brass Voice' });
addNode('adsr-brass', 'adsr', 500, 1050, { attack: 0.02, decay: 0.4, sustain: 0.2, release: 0.3, label: 'Brass Env' });
addNode('osc-brass-1', 'osc', 500, 850, { frequency: 220, waveform: 'sawtooth', detune: -8, label: 'Brass Saw 1' });
addNode('osc-brass-2', 'osc', 500, 950, { frequency: 220, waveform: 'sawtooth', detune: 8, label: 'Brass Saw 2' });
addNode('gain-brass-sum', 'gain', 700, 900, { gain: 0.7, label: 'Brass Mix' });
addNode('filter-brass', 'filter', 900, 900, { filterType: 'lowpass', frequency: 1500, detune: 0, q: 2.0, gain: 0, label: 'Brass Filter' });
addNode('math-brass-env', 'math', 700, 1050, { operation: 'multiplyAdd', a: 0, b: 3000, c: 800, label: 'Env -> Cutoff' });
addNode('gain-brass-out', 'gain', 1100, 900, { gain: 0, label: 'Brass Amp' });

connect('pbr-vbr', 'piano-brass', 'trigger', 'voice-brass', 'trigger');
connect('vbr-abr', 'voice-brass', 'gate', 'adsr-brass', 'gate');
connect('vbr-obr1', 'voice-brass', 'note', 'osc-brass-1', 'frequency');
connect('vbr-obr2', 'voice-brass', 'note', 'osc-brass-2', 'frequency');
connect('obr1-gbrs', 'osc-brass-1', 'out', 'gain-brass-sum', 'in');
connect('obr2-gbrs', 'osc-brass-2', 'out', 'gain-brass-sum', 'in');
connect('gbrs-fbr', 'gain-brass-sum', 'out', 'filter-brass', 'in');
connect('abr-mbr', 'adsr-brass', 'envelope', 'math-brass-env', 'a');
connect('mbr-fbr', 'math-brass-env', 'out', 'filter-brass', 'frequency');
connect('fbr-gbro', 'filter-brass', 'out', 'gain-brass-out', 'in');
connect('abr-gbro', 'adsr-brass', 'envelope', 'gain-brass-out', 'gain');

// --- WHISTLE ---
const whistleNotes = [
    { pitch: 79, step: 0, duration: 6, velocity: 0.6 },
    { pitch: 82, step: 8, duration: 4, velocity: 0.6 },
    { pitch: 84, step: 12, duration: 8, velocity: 0.6 },

    { pitch: 86, step: 24, duration: 4, velocity: 0.6 },
    { pitch: 84, step: 28, duration: 4, velocity: 0.6 },

    { pitch: 79, step: 32, duration: 6, velocity: 0.6 },
    { pitch: 77, step: 40, duration: 4, velocity: 0.6 },
    { pitch: 79, step: 44, duration: 8, velocity: 0.6 },

    { pitch: 82, step: 56, duration: 4, velocity: 0.6 },
    { pitch: 84, step: 60, duration: 4, velocity: 0.6 },
];
addNode('piano-whistle', 'pianoRoll', 40, 1200, { steps: 64, octaves: 3, baseNote: 72, notes: whistleNotes, label: 'Whistle Lead' });
connect('tw', 'transport-1', 'out', 'piano-whistle', 'transport');

addNode('voice-whistle', 'voice', 300, 1200, { portamento: 0.18, label: 'Whistle Voice' });
addNode('adsr-whistle', 'adsr', 500, 1350, { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4, label: 'Whistle Env' });
addNode('osc-whistle', 'osc', 500, 1200, { frequency: 880, waveform: 'triangle', detune: 0, label: 'Whistle Osc' });
addNode('filter-whistle', 'filter', 700, 1200, { filterType: 'bandpass', frequency: 2500, detune: 0, q: 2.5, gain: 0, label: 'Whistle Tone' });
addNode('lfo-whistle', 'lfo', 500, 1450, { rate: 0.15, depth: 500, waveform: 'sine', label: 'Whistle Vibrato' });
addNode('math-whistle-vib', 'math', 700, 1450, { operation: 'add', a: 2500, b: 0, c: 0, label: 'Vibrato Sum' });
addNode('phaser-whistle', 'phaser', 900, 1200, { rate: 0.3, depth: 0.8, feedback: 0.2, baseFrequency: 1000, stages: 4, mix: 0.5, label: 'Whistle Phaser' });
addNode('delay-whistle', 'delay', 1100, 1200, { delayTime: 0.38, feedback: 0.4, label: 'Whistle Echo' });
addNode('reverb-whistle', 'reverb', 1300, 1200, { decay: 4.0, mix: 0.35, label: 'Whistle Space' });
addNode('gain-whistle-out', 'gain', 1500, 1200, { gain: 0, label: 'Whistle Amp' });

connect('pw-vw', 'piano-whistle', 'trigger', 'voice-whistle', 'trigger');
connect('vw-aw', 'voice-whistle', 'gate', 'adsr-whistle', 'gate');
connect('vw-ow', 'voice-whistle', 'note', 'osc-whistle', 'frequency');
connect('ow-fw', 'osc-whistle', 'out', 'filter-whistle', 'in');
connect('lw-mw', 'lfo-whistle', 'out', 'math-whistle-vib', 'b');
connect('mw-fw', 'math-whistle-vib', 'out', 'filter-whistle', 'frequency');
connect('fw-phw', 'filter-whistle', 'out', 'phaser-whistle', 'in');
connect('phw-dw', 'phaser-whistle', 'out', 'delay-whistle', 'in');
connect('dw-rw', 'delay-whistle', 'out', 'reverb-whistle', 'in');
connect('rw-gwo', 'reverb-whistle', 'out', 'gain-whistle-out', 'in');
connect('aw-gwo', 'adsr-whistle', 'envelope', 'gain-whistle-out', 'gain');

// --- MIXING & MASTERING ---
addNode('gain-music-sum', 'gain', 1800, 600, { gain: 0.85, label: 'Music Bus' });
connect('gbo-gms', 'gain-bass-out', 'out', 'gain-music-sum', 'in');
connect('gbro-gms', 'gain-brass-out', 'out', 'gain-music-sum', 'in');
connect('gwo-gms', 'gain-whistle-out', 'out', 'gain-music-sum', 'in');

addNode('compressor-master', 'compressor', 2100, 200, { threshold: -18, knee: 12, ratio: 4.0, attack: 0.005, release: 0.15, sidechainStrength: 0.65, label: 'Master Ducking' });
connect('gds-cm', 'gain-drums-sum', 'out', 'compressor-master', 'in');
connect('gms-cm', 'gain-music-sum', 'out', 'compressor-master', 'in');
connect('gks-cm', 'gain-kick-sum', 'out', 'compressor-master', 'sidechainIn');

addNode('output-1', 'output', 2400, 200, { playing: false, masterGain: 0.8, label: 'Main Output' });
connect('cm-out', 'compressor-master', 'out', 'output-1', 'in');

const patch = {
    version: 1,
    name: 'West Coast GFunk 64 — Fluid Groove',
    nodes,
    connections,
    interface: { inputs: [], events: [], midiInputs: [], midiOutputs: [] }
};

fs.writeFileSync(patchPath, JSON.stringify(patch, null, 2) + '\n');
console.log('Generated new fluid GFunk patch.');
