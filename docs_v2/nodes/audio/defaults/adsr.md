# AUDIO — ADSR (`adsr`)

## Summary

Envelope from **envelopes.lib** (`en.adsr`) with a UI gate.

## Ports

- **Inputs:** `gate`, `attack`, `decay`, `sustain`, `release`.
- **Outputs:** `envelope` (audio).

## Faust notes

- See [envelopes](https://faustlibraries.grame.fr/libs/envelopes/).
- Catalog snippet uses `button("gate")` for a manual gate; graph-driven gates belong in codegen wiring.
