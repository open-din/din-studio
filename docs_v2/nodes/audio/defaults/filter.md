# AUDIO — Lowpass / Filter (`filter`)

## Summary

Lowpass emphasis via **filters.lib** (`fi.lowpass`) with frequency, detune (semitone offset), and output trim.

## Ports

- **Inputs:** `in`, `frequency`, `q`, `detune`, `gain`.
- **Outputs:** `out`.

## Faust notes

- `fi.lowpass` order fixed in snippet; extend with resonant or biquad variants when codegen maps `q` fully.
