# Overview

## 1. Purpose

**din-studio** is the standalone editor, shell, launcher, MCP target, and codegen workspace for Open DIN. It provides:

- A visual **studio graph** (heterogeneous node types: DSP, transport, timeline, UI, routing, analysis, etc.).
- **Faust-oriented DSP compilation** of the **audio subgraph** extracted from the master `.din` document into a **single Faust `process`**.
- **React** UI for nodes, inspectors, drawers, and shell panels.
- Integration hooks toward **din-core** (validation, runtime session, WASM) and **react-din** (public patch surfaces where applicable).

## 2. Source of truth

The **master document** of a studio project is a **`.din`** file.

The `.din` describes the whole studio:

- Nodes and edges (including nested groups / subgraphs).
- Assets and references (buffers, audio sources, samples, impulses).
- Transport and timeline / sequencers (as document-level concepts).
- Voices and musical abstractions (as node or scene-level concepts).
- Exposed parameters and routing.
- DSP fragments and module references.

**Rule:** `.din` is the global studio model. **Faust is not** the primary project interchange format; it is the **DSP backend** for the audio subsystem.

## 3. Architectural formula

> **din-studio uses `.din` as the master studio format. The engine extracts the audio/DSP subgraph from that document and compiles it to one final Faust `process`.**

Implications:

- The **full studio graph** may contain many non-Faust nodes (`transport`, `timeline`, `interface`, etc.).
- Only the **DSP-relevant** subset is lowered to Faust (see [05-faust-codegen.md](./05-faust-codegen.md)).

## 4. Design principles

### 4.1 Separation of concerns

| Layer | Responsibility |
|-------|----------------|
| `.din` | Authoritative structure, IDs, ports, params, assets, timelines |
| Faust codegen | Audio signal flow, block algebra, library usage |
| Faust runtime | Sample-accurate execution of compiled DSP (host integration) |
| React UI | Visual editor, controls, inspection — not raw Faust UI |
| din-core | Document validation, query APIs, runtime session, WASM boundary |

### 4.2 Deterministic lowering

Given the same `.din` DSP subgraph and codegen version, the generated Faust program must be stable (modulo explicit toolchain/version flags).

### 4.3 Parametric DSP interface

Parameters may be:

- **Local** (Faust widgets) when not connected in the graph.
- **External inputs** to the final `process` when driven by another node or automation (see [06-params-binding.md](./06-params-binding.md)).

## 5. Repo boundaries

### 5.1 din-studio **owns**

- Editor graph UX, node catalog metadata, and codegen from graph → Faust.
- Shell, launcher, panels, asset flows.
- MCP target behavior and tests.
- `project/COVERAGE_MANIFEST.json` and `project/SURFACE_MANIFEST.json` (studio surfaces).

### 5.2 din-studio **does not** own

- Public patch schema publication → **react-din**
- Rust runtime semantics, registry authority, DinDocument validation core → **din-core**
- Workspace agent routing → **din-agents**

## 6. Conformance (editor product)

A conformant din-studio **product build** should be able to:

1. Load and persist `.din`.
2. Edit the studio graph visually with stable node IDs.
3. Extract the DSP subgraph and emit a single Faust `process` program.
4. Map studio parameters to Faust paths for runtime control.
5. Delegate document validation / runtime stepping to **din-core** where integrated.

## 7. Explicit non-goals (v0.x)

- Replacing DinDocument interchange with Faust source as the saved project format.
- Mandating a single audio backend (Faust is the **specified** DSP language; hosts may add others later via `engine` fields).
- Defining network or filesystem APIs inside this dossier.
