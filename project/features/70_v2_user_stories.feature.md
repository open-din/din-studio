# 70 V2 User Stories

## Feature

Keep the v2 product intent available from `project/features` without forcing agents to load every file under `v2/user-stories/`.

## Source Of Truth

- `v2/user-stories/dindocument-master-document.feature`
- `v2/user-stories/studio-node-model.feature`
- `v2/user-stories/graph-editor-visual-surface.feature`
- `v2/user-stories/faust-codegen-and-parameters.feature`
- `v2/user-stories/runtime-bridge-and-tooling.feature`

## Story Groups

### F70-S01 DinDocument stays the authoritative studio document

**Given** work touches loading, validation, persistence, or round-trip behavior
**When** contributors scope the change
**Then** they should treat DinDocument v1 JSON as the studio master document and defer normative interchange rules to `open-din/v2`

### F70-S02 The studio node model stays aligned with the v2 taxonomy

**Given** work touches catalog structure, node payloads, ports, params, or nested graph behavior
**When** contributors review the impact
**Then** they should align the editor-facing node model with `v2/specs/03-node-model.md` before drilling into individual tasks

### F70-S03 Graph editing keeps stable document ids and port ids

**Given** work touches handles, connections, undo/redo, or transactional graph edits
**When** contributors choose the relevant implementation slice
**Then** they should preserve document ids and logical port ids as the authoritative graph identifiers

### F70-S04 Faust codegen stays deterministic and manifest-driven

**Given** work touches DSP extraction, lowering, parameter lifting, or emitted manifests
**When** contributors plan the change
**Then** they should preserve the single-process Faust pipeline and deterministic manifest contract described in the v2 specs

### F70-S05 Runtime bridge and MCP tooling stay non-blocking and contract-safe

**Given** work touches workers, compile lifecycle, MCP codegen, or host integration
**When** contributors choose tests and docs
**Then** they should treat the runtime bridge and MCP contract as shared delivery surfaces that must stay aligned with v2 compile output
