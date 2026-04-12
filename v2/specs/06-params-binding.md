# Parameters and binding

## 1. Studio parameter model

Each `dsp` node exposes zero or more **params** in `.din`. Params are **not** graph edges; they describe internal controls.

Example:

```json
{
  "id": "freq",
  "name": "Frequency",
  "dataType": "float",
  "default": 440,
  "range": {
    "min": 20,
    "max": 20000,
    "step": 1,
    "unit": "Hz",
    "scale": "log"
  },
  "faust": {
    "path": "/Oscillator/Frequency",
    "widgetType": "hslider"
  }
}
```

## 2. Faust widget mapping

Faust active widgets declare runtime parameters. Recommended mapping:

| Faust widget | Studio `dataType` | Notes |
|--------------|-------------------|-------|
| `hslider`, `vslider`, `nentry` | `float` or `int` | Use `step` and rounding policy for `int` |
| `checkbox` | `bool` | |
| `button` | `event` | Momentary / trigger semantics |
| `nentry` with `style:menu` or equivalent | `enum` | Discrete set from metadata |
| `bargraph` | analysis output | Host reads as meter / scope driver |

**Path:** Faust hierarchical paths (e.g. `/Oscillator/Frequency`) MUST be stable for WASM/host `setParam` addressing.

## 3. Externalization rule

When a param is **driven from the graph** (modulation, automation, control-rate link):

### 3.1 Unconnected param

- Keep the Faust **local widget** (`hslider`, etc.).
- Expose via runtime `setParam` using `faust.path`.

### 3.2 Connected param

- **Remove** the local widget from generated Faust (or replace with a pure variable).
- **Promote** the value to an **external input** of the node’s Faust function.
- **Bubble** external inputs to the **final `process(...)`** signature in deterministic order (see [05-faust-codegen.md](./05-faust-codegen.md)).

Example transformation:

**Before (local):**

```faust
freq = hslider("freq",440,20,20000,1);
gain = hslider("gain",1,0,1,0.01);
process = os.osc(freq) * gain;
```

**After (`freq` and `gain` wired from graph):**

```faust
process(freq,gain) = os.osc(freq) * gain;
```

## 4. Binding representation in `.din`

Preferred explicit form:

```json
{
  "bindings": [
    {
      "paramId": "freq",
      "source": { "nodeId": "lfo-1", "portId": "out" }
    }
  ]
}
```

Alternative: a dedicated **input port** on the node with the same id as the param (`freq_cv`).

**Codegen MUST** normalize both representations to the same externalization pass.

## 5. Control rate vs audio rate

- **Audio-rate** modulation MUST use `audio` ports and appropriate Faust types (no `hslider`).
- **Control-rate** modulation MAY use `float` ports updated per block or at UI timer rate depending on host policy.

Document the host’s **minimum update interval** for external `float` params in `10-runtime-bridge.md` integration notes.

## 6. Runtime API (conceptual)

Mapping:

| Studio | Faust / host |
|--------|----------------|
| `setParam(nodeId, paramId, value)` | Resolve → `faust.path` → `dsp.setParamValue(path, value)` |
| `subscribeParam(nodeId, paramId)` | Host mirrors UI from WASM callbacks or polling |

**Rule:** `nodeId` + `paramId` is the editor-stable key; `faust.path` is the engine-stable key.

## 7. Enum and scale metadata

- `scale: "log"` SHOULD map to Faust `si.smoo` / `ba.lin2LogGain` patterns where appropriate — exact choice is **primitive-defined**.
- `enum` MUST serialize to `int` or `string` consistently; WASM layer uses one convention per build.

## 8. Validation

- Reject bindings that create **cycles** at control rate unless explicitly supported.
- Reject `audio` → `param` binding without an explicit **downsampling** or **follower** node in path.
