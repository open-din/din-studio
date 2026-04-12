# Node model

## 1. Core concepts

Every node in `.din` has:

- **`type`** — structural role in the studio (what subsystem owns it).
- **`kind`** — domain specialization (oscillator, sampler, group, etc.).

Example:

```json
{
  "id": "osc-1",
  "type": "dsp",
  "kind": "oscillator",
  "name": "Oscillator"
}
```

## 2. Structural types (`type`)

Recommended vocabulary:

| `type` | Role |
|--------|------|
| `interface` | Host I/O surfaces (audio in/out, MIDI ports, control bus) |
| `dsp` | Signal processing or audio generation (Faust-backed) |
| `transport` | Tempo, play state, clock |
| `timeline` | Sequencers, tracks, clips |
| `voice` | Playable musical entity (may aggregate DSP + MIDI) |
| `asset` | Files, banks, buffers, sample slots |
| `value` | Constants, math, compare, logic |
| `routing` | Split, merge, matrix, send/return |
| `analysis` | Meters, scopes, spectrum, followers |
| `graph` | Group, macro, nested subgraph |

**Not all node types are Faust nodes.** Only the **`dsp`** subgraph participates in Faust codegen (plus any `routing`/`interface` elements that define audio plumbing into that subgraph).

## 3. Node payload (recommended shape)

```json
{
  "id": "osc-1",
  "type": "dsp",
  "kind": "oscillator",
  "name": "Oscillator",
  "inputs": [],
  "outputs": [],
  "params": [],
  "engine": {},
  "ui": {},
  "state": {}
}
```

| Field | Description |
|-------|-------------|
| `inputs` / `outputs` | **Ports** for graph connections |
| `params` | Internal controls (may be exposed to UI and Faust) |
| `engine` | Backend descriptor (`faust`, references, compile hints) |
| `ui` | Editor presentation hints (colors, layout, component keys) |
| `state` | Runtime-only or persisted non-DSP state (e.g. last file path) |

## 4. Ports vs params

### 4.1 Ports

**Ports** connect nodes. They carry typed values or signals between nodes.

Recommended port types:

| Port type | Use |
|-----------|-----|
| `audio` | Multichannel audio |
| `float` | Scalar float modulation or control rate |
| `int` | Integer |
| `bool` | Boolean |
| `enum` | Discrete set |
| `event` | Triggers (gates, clocks, one-shots) |
| `data` | Opaque or structured blobs (buffers, MIDI lists) |

Each port SHOULD declare:

- `id` (stable)
- `type`
- optional `channels` (audio)
- optional `direction`: `in` | `out` (or infer from lists)

### 4.2 Params

**Params** configure internal node behavior. They are edited in the inspector, may show on the node body, and map to Faust widgets or external arguments.

Examples: `freq`, `gain`, `cutoff`, `wave`, `attack`.

**Rule:** The separation between **ports** (graph wires) and **params** (internal controls) is **normative** for din-studio.

### 4.3 Connecting modulation to params

When a modulation source targets a param:

- Represent either:
  - **A dedicated input port** on the DSP node (e.g. `freq_mod` of type `float`), or
  - An **`bindings[]`** entry: `{ "paramId": "freq", "source": { "nodeId", "portId" } }`

The codegen layer MUST interpret this as **param externalization** (see [06-params-binding.md](./06-params-binding.md)).

## 5. Graph nodes (`type: graph`)

Groups encapsulate subgraphs for reuse and editor navigation.

```json
{
  "id": "group-1",
  "type": "graph",
  "kind": "group",
  "name": "Bass Voice",
  "graph": {
    "nodes": [],
    "edges": []
  }
}
```

**Nested graphs** flatten to a single DSP `process` by **inlining** child `dsp` nodes with name-mangled identifiers in Faust.

## 6. DSP node engine descriptor (summary)

`dsp` nodes carry an `engine` object. Typical Faust entry:

```json
{
  "engine": {
    "backend": "faust",
    "source": {
      "language": "faust",
      "imports": ["stdfaust.lib"],
      "code": "process = os.osc(440);"
    }
  }
}
```

Full rules: [04-dsp-and-faust.md](./04-dsp-and-faust.md), [05-faust-codegen.md](./05-faust-codegen.md).

## 7. Analysis and non-DSP nodes

`analysis` nodes may:

- Tap `audio` ports **without** participating in the main `process` chain, or
- Be implemented in the host (Web Audio Analyser, worklet FFT).

When compiled to Faust, analyzer taps SHOULD use **parallel routing** (`<:` / `,`) with care to avoid altering dry path gain.

## 8. Studio node UI JSON (catalog) vs `.din` persistence

The **Studio node catalog** MAY be authored as **Studio-only JSON** definitions that drive React Flow handles, palette grouping, inspector copy, and optional Faust source metadata for DSP nodes. That contract is **not** part of the DinDocument / `.din` interchange schema and MUST NOT be treated as persisted graph node shape.

- **`.din` nodes** use the payload in §3 (ports, params, `engine`, `ui`, etc.) and interchange rules owned by `din-core` / `open-din/v2`.
- **Catalog JSON** is the editor’s **interface definition source of truth** for built-in and authored palette entries; it maps into the UI layer only.

Normative field list, port schema, validation, and TypeScript types: [09-ui-components.md §10](./09-ui-components.md#10-studio-node-catalog-json-ui-contract).

## 9. Validation expectations

Studio validation SHOULD (delegating to din-core where integrated):

- Reject duplicate ids in a scope.
- Reject cycles where forbidden by routing policy.
- Reject type mismatches on edges (e.g. `audio` → `event`).
- Ensure every `dsp` node has a well-formed `engine` or primitive `kind` mapping.
