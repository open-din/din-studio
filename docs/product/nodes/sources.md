# Sources nodes

Sources generate or schedule **control**, **note**, **audio**, and **automation** signals. Add them from the **Sources** section of the **Catalog**.

## Params (Input)

Exposes **graph parameters** you can wire to other nodes or modulation. Use it when you want a single place on the graph for values that drive many destinations.

## UI Tokens

Bridges **UI-facing tokens** into the patch so visual or shell-level values can participate in the graph. Use when building patches that react to shared UI state.

## Event Trigger

Emits **trigger** events into the patch when something should fire once or pulse. Often paired with envelopes, noise bursts, or sampled hits that need a **gate**.

## Transport

Master **clock**: tempo, run/stop, and timing for the graph. **Singleton**—only one per graph. Wire its clock output into **Step Sequencer**, **Piano Roll**, or anything else that should lock to the same tempo.

## Step Sequencer

**Rhythmic gate or value patterns** on steps. Connect **Transport** so steps advance in time. Typical use: drums, pulses, or stepped modulation.

## Piano Roll

**Melodic sequencing**: notes over time in a piano-roll view. Connect **Transport** for playback position. Use for bass lines, leads, or any pitched pattern.

## LFO

**Low-frequency oscillator** for slow moving control signals (tremolo-like speed). Wire **rate** and **depth** from other nodes for complex modulation; use **Out** to modulate filter cutoff, pan, gain, etc.

## Constant Source

Outputs a **steady numeric value** (like a fixed voltage). Use to bias a mix, offset a modulation, or hold a parameter at a exact number when you do not need a full envelope.

## Media Stream

Brings **live input** from microphone or system audio (depending on browser permissions and device) into the patch as an audio source.

## Patch

**Nested graph**: pick another **graph** in the project or a **patch asset** as the implementation. The node grows **input** and **output** handles to match that patch’s public interface, so you can treat a whole design as one block. If you change the source, invalid cables are removed automatically.

## Voice

**Polyphonic voice** helper: MIDI-like note input becomes **frequency**, **gate**, and **velocity** outputs for building synth voices. Combine with **ADSR**, **Osc**, and **Mixer**.

## ADSR

**Attack–decay–sustain–release envelope** from a **gate** input. Drives amplitude shapes, filter sweeps, or any target that needs a controllable contour.

## Note

Converts a **note** specification into a **frequency** output for oscillators or filters tuned by pitch.

## Oscillator

**Tonal audio source** with pitch and detune inputs. The basic building block of subtractive or FM-style layouts.

## Noise

**Continuous noise** generator for percussion beds, wind, or random modulation sources.

## Noise Burst

**Short noise burst** triggered by a **trigger** input—good for snares, hats, and one-shot textures.

## Sampler

Plays **audio from the library** by sample ID. Choose a file in the node or inspector; trigger and pitch inputs behave like a simple sampler voice.

---

[← Nodes index](./README.md) · [MIDI nodes →](./midi.md)
