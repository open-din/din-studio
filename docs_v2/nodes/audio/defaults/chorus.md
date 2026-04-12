# AUDIO — Chorus (`chorus`)

## Summary

Modulated delay offset for detuned doubling; uses `os.osc` modulation and dry/wet mix.

## Ports

- **Inputs:** `in`, `rate`, `depth`, `feedback`, `delay`, `mix`.
- **Outputs:** `out`.

## Faust notes

- `feedback` port reserved for richer `+~` networks in codegen.
