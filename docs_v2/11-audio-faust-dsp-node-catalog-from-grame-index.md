# Task 11 — AUDIO Faust DSP node catalog (Grame index)

Implements Phase 1 of `v2/tasks/**/11-audio-faust-dsp-node-catalog-from-grame-index.feature`: curated **AUDIO** palette rows with non-empty Faust `dsp` text, shipped as YAML under `ui/editor/built-in-nodes/audio/` (optional JSON overlay: `studio-node-catalog.json`).

## Deliverables

- Catalog overrides for Phase 1 AUDIO Faust node names (`osc`, `noise`, `lfo`, `adsr`, `filter`, `gain`, `panner`, `compressor`, `distortion`, `delay`, `reverb`, `chorus`, `flanger`, `analyzer`) with `category: "AUDIO"` and subcategories from the task REPORT block. The **Sampler** asset node lives under `built-in-nodes/sources/assets/` (not AUDIO Faust).
- Per-node specs: `docs_v2/nodes/audio/defaults/` (see [README](./nodes/audio/defaults/README.md)).

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- Unit: `tests/unit/studio-node-catalog.spec.ts`

## Reference

- UI contract: `v2/specs/09-ui-components.md` §10
- Implementation map: `docs_v2/10-studio-node-ui-json-catalog.md`
- Faust libraries: [faustlibraries.grame.fr/libs](https://faustlibraries.grame.fr/libs/)
