# DSP and Faust

## 1. Role of Faust

**Faust** (Functional Audio Stream) is the **DSP authoring language** for din-studio audio blocks.

Faust is **not** the master project format. It is used to:

- Describe **DSP blocks** (`dsp` nodes).
- Compose the **audio subgraph** algebraically.
- Emit a **single final `process`** expression for the whole subgraph (see [05-faust-codegen.md](./05-faust-codegen.md)).

## 2. Language baseline

- Faust programs are **textual** `.dsp` fragments stored in `.din` (inline) or referenced from `collections` / build artifacts.
- Each node fragment MUST be valid Faust when placed in context (imports resolved, identifiers unique after mangling).
- The codegen pipeline MUST prepend **`import("stdfaust.lib");`** when a node or the aggregate program requires standard definitions.

Reference documentation:

- Faust language: [faust.grame.fr](https://faust.grame.fr/)
- **Standard libraries index:** [faustlibraries.grame.fr/libs/](https://faustlibraries.grame.fr/libs/)

## 3. `stdfaust.lib` and the standard library tree

din-studio codegen and primitive implementations SHOULD rely on **`stdfaust.lib`** as the **root import** for portable DSP.

`stdfaust.lib` aggregates the standard Faust library modules. The public index (Faust Libraries) lists the following **first-class library families** available under the standard distribution (non-exhaustive descriptions — refer to upstream docs per module):

| Library | Typical use in din-studio |
|---------|---------------------------|
| `aanl` | Analysis helpers |
| `analyzers` | Level, spectrum, scope primitives |
| `antialiased` | Anti-aliased oscillators / filters |
| `basics` | Core utilities |
| `compressors` | Dynamics |
| `debug` | Debug taps / printers |
| `delays` | Delay lines |
| `demos` | Example building blocks |
| `dx7/*` | FM operator toolkit (specialized) |
| `envelopes` | ADSR, segments |
| `fds` | Finite difference schemes |
| `filters` | LP/HP/BP/AP, shelving |
| `hoa` | Higher-order Ambisonics |
| `hysteresis` | Nonlinear hysteresis |
| `interpolators` | Interpolation |
| `linearalgebra` | Vector/matrix ops |
| `maths` | Math primitives |
| `mi` | Musical instrument helpers |
| `misceffects` | Misc FX |
| `motion` | Motion / modulation helpers |
| `noises` | Noise generators |
| `oscillators` | `os.*` and related |
| `phaflangers` | Phaser / flanger |
| `physmodels` | Physical modeling |
| `quantizers` | Quantization |
| `reducemaps` | Map reductions |
| `reverbs` | Reverb algorithms |
| `routes` | Routing helpers |
| `signals` | Signal utilities |
| `soundfiles` | `sf.*` sound file players |
| `spats` | Spatialization |
| `synths` | Example synths |
| `vaeffects` | Virtual analog style effects |
| `version` | Library version metadata |
| `wdmodels` | Wave digital filters |
| `webaudio` | WebAudio-oriented helpers |

**Policy:** Primitive nodes shipped with din-studio SHOULD prefer **standard library** functions over ad-hoc duplicate DSP except when a smaller fixed-point or WASM size target requires custom code.

## 4. Imports in `.din`

DSP nodes MAY declare explicit imports:

```json
"source": {
  "language": "faust",
  "imports": [
    "stdfaust.lib",
    "oscillators.lib",
    "filters.lib"
  ],
  "code": "import(\"oscillators.lib\"); process = os.osc(440);"
}
```

**Rule:** If `imports[]` is present, the codegen MUST emit those imports **once** at the top of the generated file (deduplicated, stable order).

## 5. Widgets and metadata

Faust **active widgets** (`hslider`, `vslider`, `nentry`, `checkbox`, `button`, `vgroup`/`hgroup`, etc.) declare parameters and hierarchy.

din-studio uses widget metadata as **hints** for:

- Default values and ranges
- Parameter paths (`/Oscillator/Frequency`)
- Mapping to studio `params[]` (see [06-params-binding.md](./06-params-binding.md))

**UI rule:** React renders the final UI; Faust widgets are **not** the shipped end-user UI in the editor product.

## 6. Multichannel and `bus`

Faust expressions use `:` (serial), `,` (parallel), `<:` (split), `:>` (merge). Multichannel width MUST match across serial composition.

Codegen MUST insert explicit `par(i, n, …)` or library bus helpers when widening/narrowing channels.

## 7. Non-Faust engines

`engine.backend` MAY allow future values (`wasm`, `worklet`, `native`). Interchange via DinDocument `dspModules[].engine` remains valid.

When `backend != faust`, din-studio MAY:

- Stub codegen for that subgraph, or
- Delegate to host-specific loaders per `compiledDsp` metadata (`dsp-structure.md`).

## 8. Analyzer side-paths

Some `analyzers` outputs are **not audio**. They may be realized as:

- Faust `bargraph` outputs (slow visual path), or
- Host analyzers (preferred for FFT in browser).

The document MUST label analyzer outputs in the node `outputs[]` with `kind: analyzer` per DinDocument suggestions.
