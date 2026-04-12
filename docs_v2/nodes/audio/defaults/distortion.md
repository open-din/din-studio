# AUDIO — Distortion (`distortion`)

## Summary

Waveshaping with `ma.tanh` after drive; level trim in dB.

## Ports

- **Inputs:** `in`, `drive`, `level`, `mix`, `tone`.
- **Outputs:** `out`.

## Faust notes

- Catalog snippet maps drive + level; `mix` / `tone` reserved for extended codegen.
