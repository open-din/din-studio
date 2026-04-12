# din-studio v2 technical documentation

English only. Each implementable task under `tasks/todo/` should gain a matching page here when work completes, before the task’s `.feature` file moves to `v2/features/`.

## Index (populate per task)

| Task slug | Document | Status |
|-----------|----------|--------|
| `01-dindocument-editor-bridge` | `01-dindocument-editor-bridge.md` | Pending implementation |
| `02-node-catalog-taxonomy` | `02-node-catalog-taxonomy.md` | Pending implementation |
| `03-graph-editor-ports-edges` | `03-graph-editor-ports-edges.md` | Pending implementation |
| `04-primitives-dsp-registry` | `04-primitives-dsp-registry.md` | Pending implementation |
| `05-dsp-subgraph-extraction` | `05-dsp-subgraph-extraction.md` | Pending implementation |
| `06-faust-codegen-single-process` | `06-faust-codegen-single-process.md` | Pending implementation |
| `07-params-binding-manifest` | `07-params-binding-manifest.md` | Pending implementation |
| `08-runtime-bridge-integration` | `08-runtime-bridge-integration.md` | Pending implementation |
| `09-mcp-codegen-contract` | `09-mcp-codegen-contract.md` | Pending implementation |

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
