# Faust code generation

## 1. Goal

Transform the **DSP subgraph** from `.din` into **one Faust program** with:

- Local block definitions per node (name-mangled).
- A **single** top-level `process` expression wiring all audio I/O.

**Rule:** Do **not** emit multiple competing `process` lines. Everything merges into **one** `process`.

## 2. Subgraph extraction

From the studio graph, select nodes and edges that participate in audio compilation:

### 2.1 Include

- All nodes with `type: dsp`.
- `routing` nodes that implement audio split/merge/mix **unless** implemented purely in host.
- `interface` nodes defining **audio input/output** boundaries for the compiled patch.

### 2.2 Exclude (typically)

- `transport`, `timeline`, `asset` metadata nodes (unless they expose control-rate Faust inputs via bindings).
- Pure UI or MCP-only nodes.

### 2.3 Group inlining

For each `type: graph`, **inline** nested `dsp` nodes into the parent compilation unit with ids like `n_<nodeId>_<suffix>` to avoid collisions.

## 3. Emission order

Recommended pipeline:

1. **Preamble** — file header, `import` list (deduped).
2. **Declarations** — `n_osc1 = …;`, `n_lp1 = …;` etc.
3. **Process** — single expression composing declarations.
4. **Metadata attachment** — optional JSON sidecar for param paths (not part of Faust syntax).

## 4. Connection lowering

### 4.1 Serial chain

`A -> B -> C` on audio ports becomes:

```faust
process = n_A : n_B : n_C;
```

### 4.2 Parallel paths

Independent branches that feed a mixer:

```faust
process = n_A , n_B :> n_mix;
```

### 4.3 Split / tap

Dry/wet or tap:

```faust
process = n_drywet <: (n_wet , _) :> +;
```

(Exact pattern depends on channel count; use library `route` helpers when available.)

### 4.4 Channel rules

- Serial (`:`) requires **equal channel counts** between expressions.
- Use `si.bus(n)`, `par`, `sum`, `route` modules from standard libraries to adjust width.

## 5. Multiple outputs / sinks

When the graph has **one** stereo main out, codegen MUST reduce to **2 channels** (or host-defined `nOut`).

Multiple physical outputs (e.g. multi-bus) MAY compile to a **wider** `process` tuple; the host MUST declare expected width in `dspModules[].outputs`.

## 6. Primitive vs custom nodes

### 6.1 Primitive `kind`

Nodes with a known `kind` (e.g. `gain`, `lowpass`) MAY expand from an internal template library **without** storing Faust per project.

### 6.2 Custom `engine.source.code`

Inline Faust is emitted **verbatim** after mangling local identifiers if needed to avoid global clashes.

## 7. Externalized parameters

When a param is driven from outside the Faust block (see [06-params-binding.md](./06-params-binding.md)):

- Remove or bypass the local widget.
- Lift the param into the **function signature** of the node block or the final `process`.

Example pattern:

```faust
n_osc(freq) = os.osc(freq);
n_gain(g, x) = x * g;
process(freq, g) = n_osc(freq) : n_gain(g);
```

The codegen MUST produce a **deterministic argument order** (e.g. lexicographic by studio `paramId`).

## 8. Determinism and naming

- **Node ids** from `.din` MUST map to Faust identifiers with a safe prefix (`n_`) and sanitized characters (`-` → `_`).
- **Port ids** append to symbol names for disambiguation when a node exposes multiple operations internally.

## 9. Sidecar artifacts

Recommended build outputs alongside `.dsp` text:

| Artifact | Purpose |
|----------|---------|
| `manifest.json` | Param paths, types, channel width, sample rate hints |
| `*.wasm` / `*.js` | Host-loaded Faust WASM (toolchain specific) |

## 10. Non-goals

- Solving general graph layout NP problems — use fixed heuristics (topo sort + user “anchor” nodes).
- Auto-fixing illegal fan-in without explicit merge nodes — **reject** or insert `:>` with explicit UX.
