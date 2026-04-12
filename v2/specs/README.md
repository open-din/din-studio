# din-studio — Technical specification dossier

Implementation-oriented technical specs for **din-studio**: the editor, shell, graph surface, Faust-oriented DSP codegen, and runtime integration boundaries.

## Assumptions

- The **master project document** is a `.din` file (see [02-din-document.md](./02-din-document.md)).
- **Faust** is the primary DSP authoring and compilation backend for the audio subgraph (see [04-dsp-and-faust.md](./04-dsp-and-faust.md)).
- **din-core** owns document semantics, validation, registry authority, and WASM runtime contracts for DinDocument; see sibling repo `din-core/din-core-specs/`.
- **react-din** owns the public patch schema and React audio primitives consumed by hosts; din-studio does not redefine interchange formats without coordination.

## Load order

1. [01-overview.md](./01-overview.md) — scope and boundaries
2. [02-din-document.md](./02-din-document.md) — `.din` container, **generation / save / export**, alignment with DinDocument
3. [03-node-model.md](./03-node-model.md) — nodes, ports, params
4. [04-dsp-and-faust.md](./04-dsp-and-faust.md) — Faust language and libraries
5. [05-faust-codegen.md](./05-faust-codegen.md) — extraction and single-`process` codegen
6. [06-params-binding.md](./06-params-binding.md) — widgets, externalization, runtime binding
7. [07-graph-editor.md](./07-graph-editor.md) — React Flow editor surface
8. [08-primitives-catalog.md](./08-primitives-catalog.md) — built-in DSP primitives
9. [09-ui-components.md](./09-ui-components.md) — React UI registry
10. [10-runtime-bridge.md](./10-runtime-bridge.md) — WASM / AudioWorklet / worker alignment

## Boundary map

| Concern | Owner |
|--------|--------|
| `.din` / studio graph as product truth in the editor | **din-studio** (this repo) |
| Public patch JSON schema, published types | **react-din** |
| DinDocument parsing, validation, runtime session, registry | **din-core** |
| Workspace agent routing and quality gates | **din-agents** |

## Related workspace docs

- `din-core/din-core-specs/` — core engine, WASM crate, worker model, transport
- `open-din/dsp-structure.md` — DinDocument v1 container (`format: open-din/din-document`), collections, scenes, `dspModules[]`

## Non-goals (this dossier)

- Full JSON Schema publication for `.din` v0.x (tracked with format stabilization)
- OSC socket, Web MIDI device discovery, or file I/O APIs (host / platform)
- Definitive Faust compiler version pinning (host toolchain policy)
