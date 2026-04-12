# AUDIO — Oscillator (`osc`)

## Summary

Sine oscillator using `os.oscsin` from **oscillators.lib** (via `stdfaust.lib`).

## Ports

- **Inputs:** `frequency` (float), `detune` (float, cents-style offset summed before `oscsin`).
- **Outputs:** `out` (audio).

## Faust notes

- Imports: `import("stdfaust.lib");`
- Core symbol: `os.oscsin` — see [oscillators](https://faustlibraries.grame.fr/libs/oscillators/).
