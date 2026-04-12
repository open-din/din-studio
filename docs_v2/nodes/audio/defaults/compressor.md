# AUDIO — Compressor (`compressor`)

## Summary

RMS dynamics via `co.RMS_compression_gain_mono_db` (**compressors.lib**).

## Ports

- **Inputs:** `in`, `sidechainIn`, `threshold`, `knee`, `ratio`, `attack`, `release`, `sidechainStrength`.
- **Outputs:** `out`.

## Faust notes

- See [compressors](https://faustlibraries.grame.fr/libs/compressors/). Sidechain routing is host/codegen; the catalog `dsp` is mono in → gain-shaped mono out.
