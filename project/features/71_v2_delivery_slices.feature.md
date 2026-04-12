# 71 V2 Delivery Slices

## Feature

Index the completed or active v2 delivery slices from `project/features` so contributors can route quickly without loading every file under `v2/features/` and `docs_v2/`.

## Source Of Truth

- Task Gherkin: `v2/features/*.feature`
- Task notes: `docs_v2/*.md`
- Normative specs: `v2/specs/*.md`

## Delivery Spine

### F71-S01 Document bridge and catalog taxonomy stay the first routing step

**Given** a change touches DinDocument loading, catalog typing, or editor node registration
**When** contributors select the v2 task
**Then** start with task `01-dindocument-editor-bridge` or `02-node-catalog-taxonomy` before opening downstream codegen or runtime slices

### F71-S02 Graph edges, DSP registry, extraction, and codegen stay on one refactor path

**Given** a change touches handles, connection policy, Faust primitives, graph extraction, or code generation
**When** contributors map the work
**Then** route through tasks `03` to `07` as one continuous pipeline instead of treating those files as unrelated features

### F71-S03 Runtime bridge and MCP codegen stay downstream of the generator contract

**Given** a change touches workers, compile orchestration, bridge protocol, or MCP output
**When** contributors pick a task and validation scope
**Then** route through tasks `08-runtime-bridge-integration` and `09-mcp-codegen-contract` after confirming generator expectations in task `06`

### F71-S04 Studio node UI catalog work stays separate from DinDocument interchange

**Given** a change touches built-in node YAML, palette grouping, handle derivation, or Studio-only node metadata
**When** contributors review the contract
**Then** route through tasks `10-studio-node-ui-json-catalog`, `11-audio-faust-dsp-node-catalog-from-grame-index`, and `12-built-in-nodes-yaml-catalog` without conflating them with persisted `.din` schema

## Task Map

| Task | Primary concern | Compact entry point |
| --- | --- | --- |
| `01-dindocument-editor-bridge` | Studio document load/save bridge | `docs_v2/README.md` + `v2/specs/02-din-document.md` |
| `02-node-catalog-taxonomy` | Type/kind/ports/params vocabulary | `v2/specs/03-node-model.md` |
| `03-graph-editor-ports-edges` | Handle ids, edge policy, undo ids | `v2/specs/07-graph-editor.md` |
| `04-primitives-dsp-registry` | Faust primitive registry | `v2/specs/04-dsp-and-faust.md`, `v2/specs/08-primitives-catalog.md` |
| `05-dsp-subgraph-extraction` | DSP graph extraction | `v2/specs/05-faust-codegen.md` |
| `06-faust-codegen-single-process` | Deterministic single-process output | `docs_v2/README.md` |
| `07-params-binding-manifest` | Param lifting and compile manifest | `v2/specs/06-params-binding.md` |
| `08-runtime-bridge-integration` | Worker/runtime integration | `v2/specs/10-runtime-bridge.md` |
| `09-mcp-codegen-contract` | MCP and bridge parity | `project/MCP_TOOL_SLICES.json` |
| `10-studio-node-ui-json-catalog` | Studio UI node contract | `docs_v2/10-studio-node-ui-json-catalog.md` |
| `11-audio-faust-dsp-node-catalog-from-grame-index` | Phase 1 AUDIO DSP catalog | `docs_v2/11-audio-faust-dsp-node-catalog-from-grame-index.md` |
| `12-built-in-nodes-yaml-catalog` | YAML-backed built-ins and palette grouping | `docs_v2/10-studio-node-ui-json-catalog.md` |
