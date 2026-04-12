# Runtime bridge

## 1. Scope

This document defines how din-studio connects:

- The **`.din`** authoritative graph
- The **compiled Faust** artifact (typically WASM + glue)
- The **din-core** runtime (document validation, transport, parameter model) where integrated

Platform I/O (AudioContext, workers, MIDI) stays in the **host**, consistent with `din-core/din-core-specs/01-overview.md` boundaries.

## 2. Deployment shapes

### 2.1 Main thread (simple)

- AudioContext on main thread.
- Faust WASM node runs in AudioWorklet or `ScriptProcessor` fallback (non-preferred).

### 2.2 Worker + AudioWorklet (recommended)

Aligns with `din-core/din-core-specs/07-worker-model.md` themes:

| Location | Responsibility |
|----------|----------------|
| Main thread | React UI, user gestures, device APIs |
| Worker | din-core WASM (`WasmDocumentHandle`, `WasmRuntimeSession`), validation, transport stepping |
| AudioWorklet | DSP execution, sample-accurate param smoothing |

## 3. Parameter path binding

**Studio keys:**

- `nodeId`
- `paramId`

**Engine keys:**

- Faust hierarchical path `/Group/Param`

**Mapping table** is produced at compile time (`manifest.json` from [05-faust-codegen.md](./05-faust-codegen.md)):

```json
{
  "params": [
    {
      "nodeId": "osc-1",
      "paramId": "freq",
      "faustPath": "/Oscillator/Frequency",
      "type": "float"
    }
  ]
}
```

Runtime:

```
setParam(nodeId, paramId, value)
  → manifest lookup
  → dsp.setParamValue(faustPath, value)
```

## 4. Externalized process arguments

When codegen promotes graph bindings to `process(a,b,c,...)`, the host MUST:

1. Allocate **control buffers** or **per-block variables** for each external argument.
2. Update them each **audio quantum** or at **control rate** per param semantics.
3. Keep argument order stable with the generated signature.

## 5. Transport and timeline

din-core exposes transport APIs (`din-core-specs/05-runtime-transport.md`). din-studio:

- Sends transport commands (`play`, `stop`, `seek`, BPM changes) to the worker session.
- Does **not** duplicate transport state as the source of truth — **din-core** session owns logical transport; UI mirrors it.

## 6. WASM error mapping

Follow `din-core-specs/06-wasm-bindings.md` error shape:

- Stable `code`, human `message`, optional `details`.

Surface in:

- Toast notifications
- Inspector “Engine” panel

## 7. Hot reload policy

When `.din` changes:

1. Diff DSP subgraph.
2. If structural audio graph changed → **recompile** Faust.
3. If only param values changed → **setParam** only.

## 8. Analyzer taps

Analyzer data MAY flow:

- From Faust `bargraph` outputs (slow), or
- From parallel host analyzers reading **tap** points.

Use `SharedArrayBuffer` or ring buffers only when cross-thread policy allows.

## 9. Security

- Treat compiled WASM as **untrusted** except when produced by pinned toolchain in CI.
- Apply CSP compatible with WASM (`script-src 'wasm-unsafe-eval'` where required).

## 10. Non-goals

- Sample-accurate scheduling of MIDI in this document (host-specific).
- Defining OSC wire protocol (see din-core bridge profiles).
