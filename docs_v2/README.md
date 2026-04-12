# din-studio v2 technical documentation

English only. Completed Gherkin tasks live in `v2/features/`. Extend this index with `docs_v2/<slug>.md` pages as APIs stabilize.

## Index (populate per task)

| Task slug | Document | Status |
|-----------|----------|--------|
| `01-dindocument-editor-bridge` | `ui/editor/dinDocument/dinDocumentBridge.ts`, `core/dinWasmValidation.ts` | Baseline (DinDocument JSON + din-wasm validation) |
| `02-node-catalog-taxonomy` | `ui/editor/faust/taxonomy.ts`, `ui/editor/nodeCatalog/index.ts` exports | Baseline |
| `03-graph-editor-ports-edges` | `ui/editor/nodeHelpers.ts` (`canConnect` + fan-in), `CustomHandle.tsx` | Baseline |
| `04-primitives-dsp-registry` | `ui/editor/faust/dspPrimitiveRegistry.ts` | Baseline |
| `05-dsp-subgraph-extraction` | `ui/editor/faust/extractDspSubgraph.ts` | Baseline |
| `06-faust-codegen-single-process` | `ui/editor/faust/faustCodegen.ts`, `graphFaustPipeline.ts` | Baseline (osc/gain/filter/output chain) |
| `07-params-binding-manifest` | `ui/editor/faust/compileManifest.ts` | Baseline |
| `08-runtime-bridge-integration` | `workers/faustCompile.worker.ts`, `faustCompile.ts` | Baseline |
| `09-mcp-codegen-contract` | `targets/mcp/src/runtime/handlers.ts`, `bridge/protocol.ts` | Baseline (Faust fields on codegen) |
| `10-studio-node-ui-json-catalog` | `docs_v2/10-studio-node-ui-json-catalog.md`, `ui/editor/studioNodeCatalog/`, `v2/specs/09-ui-components.md` §10 | Baseline (Gherkin: `v2/features/10-studio-node-ui-json-catalog.feature`) |

## Authority

- Studio product: `v2/specs/*.md` in this repo.
- Document interchange: workspace `open-din/v2` (schemas and examples).
- Core behavior: `din-core/v2/specs` (validation, runtime, WASM boundaries).

## Cross-repo v2 references

| Role | Path |
|------|------|
| Normative DinDocument | `open-din/v2/` |
| Studio product specs | `v2/specs/` (this repo) |
| Core implementation specs | `din-core/v2/specs/` |

## Agent documentation load order (minimize context)

1. Legacy `docs/` (and root `specs/` if needed) — **only paths relevant to the task.**
2. This folder — matching `docs_v2/<task-slug>.md` when it exists.
3. `v2/specs/` — **only** files cited by the task.
4. `v2/user-stories/` — **only** `.feature` files the task references.
5. `open-din/v2` — **only** files cited in the task `Background` (schemas, examples, specs).
