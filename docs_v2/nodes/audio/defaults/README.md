# AUDIO node specs (Phase 1 — Faust defaults)

Normative UI contract: `v2/specs/09-ui-components.md` §10. Faust-backed AUDIO rows live as YAML under `ui/editor/built-in-nodes/audio/<subcategory>/` (see `loadBuiltInNodeFiles.ts`). The **Sampler** node (`type: asset`) is defined under `ui/editor/built-in-nodes/sources/assets/sampler.yaml`, not in this folder. Optional merge overlay: `ui/editor/nodeCatalog/studio-node-catalog.json` (may be empty `[]`).

Faust library index: [faustlibraries.grame.fr](https://faustlibraries.grame.fr/libs/).

| Node `name` | Subcategory | Spec |
|-------------|-------------|------|
| `osc` | Generators | [osc.md](./osc.md) |
| `noise` | Generators | [noise.md](./noise.md) |
| `lfo` | Generators | [lfo.md](./lfo.md) |
| `adsr` | Envelopes and Modulation | [adsr.md](./adsr.md) |
| `filter` | Filters and Tone | [filter.md](./filter.md) |
| `gain` | Gain, Mix, and Stereo DSP | [gain.md](./gain.md) |
| `panner` | Gain, Mix, and Stereo DSP | [panner.md](./panner.md) |
| `compressor` | Dynamics and Nonlinear | [compressor.md](./compressor.md) |
| `distortion` | Dynamics and Nonlinear | [distortion.md](./distortion.md) |
| `delay` | Time-Based Effects | [delay.md](./delay.md) |
| `reverb` | Time-Based Effects | [reverb.md](./reverb.md) |
| `chorus` | Time-Based Effects | [chorus.md](./chorus.md) |
| `flanger` | Time-Based Effects | [flanger.md](./flanger.md) |
| `analyzer` | Analysis | [analyzer.md](./analyzer.md) |
