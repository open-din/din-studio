# `.din` document format

## 1. Role

The `.din` file is the **master interchange** for a din-studio project: the complete heterogeneous graph, assets, transport/timeline references, and execution hints.

This spec describes the **studio-level** shape expected by din-studio tooling. It **aligns** with the workspace DinDocument container described in `open-din/dsp-structure.md` (`format: "open-din/din-document"`) and with **din-core** query/runtime concepts (`DinDocument`, scenes, collections, `dspModules[]`).

**Versioning:** until a formal schema is published, treat `.din` as **JSON** with explicit `version` fields at container and graph levels.

## 2. Filenames and media type

- **Extension:** `.din` (content is JSON text, UTF-8).
- **Alternate interchange:** `document.din.json` / `scene.din.json` patterns from DinDocument examples may coexist during migration; the editor should normalize on save.

## 3. Top-level structure (studio projection)

Conceptually, a `.din` file used by din-studio contains:

```text
DinStudioDocument
├── meta # format, version, generator, asset hints
├── graph                   # primary studio graph (nodes, edges, groups)
├── collections             # optional: buffers, audioSources, dspModules, …
├── transport               # optional: default transport snapshot
├── timeline                # optional: sequencers, tracks, clips (studio view)
├── assets                  # optional: alias to collections or embedded refs
└── extensions # optional: vendor-specific payloads
```

### 3.1 Alignment with DinDocument v1

When targeting **din-core** validation:

- Root SHOULD include DinDocument fields: `format`, `version`, `asset`, `collections`, `scenes[]`, etc., per `dsp-structure.md`.
- The **studio graph** may live inside:
  - a dedicated `extensions.open-din/studioGraph` payload, or
  - a scene-local `graph` projection agreed with din-core profiles.

**Rule:** din-studio MUST NOT silently fork semantics that contradict **din-core** validation rules; any studio-only fields MUST be namespaced under `extensions` or an approved profile.

## 4. `meta`

| Field | Type | Description |
|-------|------|-------------|
| `format` | `string` | e.g. `"open-din/din-document"` when using DinDocument container |
| `version` | `number` | Container version |
| `generator` | `string` | Tool name and version |
| `minCoreVersion` | `string` | Optional minimum din-core / schema version |

## 5. `graph` — studio graph

### 5.1 Graph object

| Field | Type | Description |
|-------|------|-------------|
| `nodes` | `array` | Studio nodes |
| `edges` | `array` | Connections between ports |
| `groups` | `array` | Optional grouping metadata (may mirror `graph` nodes of `type: graph`) |

### 5.2 Edge shape (normative intent)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Stable edge id |
| `source` | `string` | Source node id |
| `sourceHandle` | `string` | Source port id |
| `target` | `string` | Target node id |
| `targetHandle` | `string` | Target port id |

Edges connect **ports**, not **params** directly. Param modulation is represented as edges to dedicated **param input ports** or via an explicit **binding** object on the node (see [03-node-model.md](./03-node-model.md)).

## 6. Collections and DSP modules

Per DinDocument, `collections.dspModules[]` entries describe processing units with:

- `id`, `name`, `engine` (`faust`, `wasm`, …)
- optional `faustDsp` source reference
- `inputs` / `outputs` surface for host binding

din-studio codegen **consumes** both:

- Inline Faust on `dsp` nodes (`engine.backend: faust`), and/or
- Library `dspModules[]` referenced by id from nodes.

## 7. Scenes

DinDocument **scenes** do not embed the internal DSP graph in the interchange model (`dsp-structure.md`). Instead they reference `dsp[]` module usage and declare routing.

**Studio rule:** When exporting to strict DinDocument, din-studio MUST provide a mapping from the **studio graph** to:

- `collections.dspModules[]` (Faust modules and compiled artifacts)
- scene `routing.inputRoutes` / `routing.outputRoutes`
- timeline and transport objects

The exact mapping algorithm is implementation-defined but MUST be **documented per release** in codegen notes.

## 8. IDs and stability

- Node and port ids MUST be stable across edit sessions for persistence and undo.
- Refactors (e.g. group explode/implode) MUST preserve param bindings where possible.

## 9. Generating and persisting `.din`

This section defines how din-studio **produces** `.din` bytes from editor/runtime state. Generation is distinct from **Faust codegen** ([05-faust-codegen.md](./05-faust-codegen.md)): Faust emits DSP programs; **`.din` generation** serializes the **studio document**.

### 9.1 Sources of truth in the editor

| Source | Role |
|--------|------|
| Graph store | Nodes, edges, selection, viewport (viewport MAY be omitted from saved `.din` or stored under `extensions`) |
| Asset library | `collections` entries, URIs relative to `assetRoot` |
| Inspector / node state | `params`, `bindings`, `engine`, `ui`, `state` |
| Transport / timeline UI | Optional snapshots for `transport`, `timeline` |

**Rule:** On **Save** / **Export**, the implementation MUST serialize from the same canonical model the editor mutates (no duplicate “shadow” graphs).

### 9.2 Serialization pipeline (normative intent)

1. **Normalize** — strip ephemeral UI-only fields unless allowlisted (e.g. React Flow `measured`, internal undo tokens).
2. **Validate locally** — structural checks (unique ids, edge endpoints exist, port types compatible) before write.
3. **Optional: din-core validate** — when integrated, call `validate` on the DinDocument-shaped payload and embed or attach `ValidationReport` in dev exports only.
4. **Emit JSON** — UTF-8, deterministic key ordering **recommended** for diff-friendly saves (optional but encouraged).
5. **Set `meta.generator`** — tool name and semver (e.g. `din-studio/0.42.0`).

### 9.3 Save vs export targets

| Target | Description |
|--------|-------------|
| **Studio native** | Full graph in `graph` (and/or namespaced `extensions`) plus any studio-only fields required by the product. |
| **Strict DinDocument** | Payload MUST satisfy `dsp-structure.md` and pass din-core validation; studio graph MAY live only under an agreed `extensions` key or be flattened into `scenes[]` / routing per export profile. |

Implementations SHOULD expose **Export…** with an explicit profile (`studio`, `din-document-v1`) so users know which interchange is produced.

### 9.4 Round-trip

- **Load** — parse JSON → hydrate graph store and collections.
- **Edit** — mutations update the canonical model.
- **Save** — serialize back without dropping unknown `extensions` keys (forward compatibility).

**Rule:** Unknown top-level keys under `extensions` MUST be preserved on round-trip unless the user runs an explicit **Migrate** or **Normalize** command.

### 9.5 Generated artifacts vs the `.din` file

| Artifact | Relationship to `.din` |
|----------|-------------------------|
| Compiled Faust (`.dsp`, WASM, manifest) | Referenced from `dspModules[].compiledDsp` or build outputs; **not** a replacement for `.din`. |
| Patch JSON (`react-din`) | Optional **derived** export for hosts; `.din` remains the studio master unless the product defines otherwise for a given workflow. |

### 9.6 MCP, CLI, and headless generation

- **MCP / automation** MAY apply graph patches then invoke the same serializer as the UI **Save**.
- Headless **generate** commands SHOULD accept: input template `.din`, patch operations or merge JSON, output path, export profile.

### 9.7 Atomic writes

Writes SHOULD use a temp file + `rename` (or platform equivalent) to avoid truncated `.din` on crash.

## 10. Security and untrusted content

Treat `.din` as **untrusted data**:

- Never execute arbitrary scripts from document fields.
- Faust source embedded in `.din` MUST be compiled in a **sandboxed toolchain** policy defined by the host (timeouts, resource limits).
