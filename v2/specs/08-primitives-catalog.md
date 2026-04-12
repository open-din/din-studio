# Built-in DSP primitives catalog

## 1. Purpose

**Primitives** are first-party `dsp` nodes with stable `kind` values and **reference Faust** implementations (via `stdfaust.lib` and family libraries). They are the building blocks for user patches, macros, and custom nodes.

Custom nodes MAY compose primitives or ship inline Faust.

## 2. Naming

Table columns:

- **`kind`** — JSON `kind` on `type: dsp` nodes
- **Typical Faust families** — suggested imports
- **Notes**

## 3. Generators

| kind | Faust libraries | Notes |
|------|-----------------|-------|
| `oscillator` | `oscillators.lib`, `stdfaust.lib` | Waveforms via `os.*` |
| `noise` | `noises.lib` | White/pink variants |
| `noise_burst` | `envelopes.lib`, `noises.lib` | Short burst noise |
| `constant` | `signals.lib` | DC offset / constant signal |

## 4. Filters and EQ

| kind | Faust libraries | Notes |
|------|-----------------|-------|
| `lowpass` | `filters.lib` | LP variants |
| `highpass` | `filters.lib` | HP variants |
| `bandpass` | `filters.lib` | BP |
| `eq3` | `filters.lib` / `misceffects.lib` | Shelf / bell as needed |

## 5. Dynamics and waveshaping

| kind | Faust libraries | Notes |
|------|-----------------|-------|
| `gain` | `basics.lib` / inline | Linear gain |
| `compressor` | `compressors.lib` | Dynamics |
| `distortion` | `misceffects.lib`, `vaeffects.lib` | Saturation |
| `waveshaper` | `misceffects.lib` | Curve-based |

## 6. Time-based effects

| kind | Faust libraries | Notes |
|------|-----------------|-------|
| `delay` | `delays.lib` | Feedback delay |
| `chorus` | `phaflangers.lib`, `misceffects.lib` | Modulated delay taps |
| `flanger` | `phaflangers.lib` | |
| `phaser` | `phaflangers.lib` | |
| `reverb` | `reverbs.lib` | Algorithmic |

## 7. Modulation sources

| kind | Faust libraries | Notes |
|------|-----------------|-------|
| `lfo` | `oscillators.lib` | Low-frequency oscillator |
| `adsr` | `envelopes.lib` | Envelope generator |
| `envelope` | `envelopes.lib` | Generic envelope |

## 8. Routing utilities

| kind | Faust libraries | Notes |
|------|-----------------|-------|
| `mix` | `routes.lib`, `basics.lib` | Stereo/mono mix |
| `split` | `routes.lib` | Multibus split |
| `merge` | `routes.lib` | `:>` helper patterns |
| `matrix_mixer` | `routes.lib`, `linearalgebra.lib` | N×M routing |
| `aux_send` | `routes.lib` | Wet send tap |
| `aux_return` | `routes.lib` | Return gain |

## 9. Spatial and advanced

| kind | Faust libraries | Notes |
|------|-----------------|-------|
| `panner` | `spats.lib` | Stereo pan |
| `hoa_encoder` | `hoa.lib` | Optional Ambisonics path |

## 10. Convolution and samples

| kind | Faust libraries | Notes |
|------|-----------------|-------|
| `convolver` | `misceffects.lib` / custom | IR convolution; IR from `impulses` asset |
| `sampler` | `soundfiles.lib` | `sf.play` family |

## 11. Analysis

| kind | Implementation | Notes |
|------|------------------|-------|
| `analyzer` | `analyzers.lib` or host FFT | May stay host-side in browser |

## 12. Primitive template requirements

Each primitive MUST define:

1. `inputs[]` / `outputs[]` port lists with types and channel counts.
2. `params[]` with ranges and `faust.path` conventions.
3. A **codegen template** string with slots for mangled ids.
4. Tests: golden Faust snippets for a reference graph (repo-specific).

## 13. Versioning

Adding a field to a primitive is **non-breaking** if defaults apply. Changing port ids or `kind` meaning is **breaking** and requires migration tooling.
