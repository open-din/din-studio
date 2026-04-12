# Sampler (`sampler`)

**Canonical built-in row:** `ui/editor/built-in-nodes/sources/assets/sampler.yaml` (`type: asset`, palette **Sources** / **Assets**). This page kept under `audio/defaults` for Faust notes when sample playback moves to codegen.

## Summary

Sample playback node: trigger, playback rate, detune, and audio out. Host sample buffers should bind to **soundfiles.lib** (`so.sound`, `so.loop`, etc.) in the Faust/codegen layer.

## Ports

- **Inputs:** `trigger`, `playbackRate`, `detune`.
- **Outputs:** `out` (audio).

## Faust notes

- When `dsp` is added for preview, prefer `so.sound` / table playback once asset paths are available; until then the graph may use a pitched placeholder in a separate Faust harness.
