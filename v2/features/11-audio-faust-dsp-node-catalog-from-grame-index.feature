# REPORT (normative for this task — English only)
#
# 1) Goal
# Build a curated **AUDIO** DSP node collection for the Studio palette whose **authoritative DSP text is Faust**,
# grounded in the public Faust standard libraries index:
#   - https://faustlibraries.grame.fr/
#   - https://faustlibraries.grame.fr/libs/
# Each catalog row follows `v2/specs/09-ui-components.md` §10 and `docs_v2/10-studio-node-ui-json-catalog.md`.
#
# 2) How Faust maps to a node graph (adaptation model)
# - **Single node = callable Faust fragment**: each `type: "dsp"` row carries a non-empty `dsp` string (plain Faust).
#   Convention: express the node core as a `process = ...` (or equivalent) snippet that compiles in isolation
#   when wrapped by the Studio Faust codegen pipeline (`v2/specs/05-faust-codegen.md`, `04-dsp-and-faust.md`).
# - **Imports**: prefer `import("stdfaust.lib");` and library environments documented on the index page (`os`, `no`,
#   `fi`, `en`, `co`, `de`, `re`, `ef`, `ve`, `pm`, etc.) so nodes stay aligned with upstream naming and mathdoc.
# - **Ports vs Faust I/O**:
#   - **Audio inputs/outputs** → `StudioNodePortSchema` with `type: "audio"` and stable `name`s; the generator binds
#     graph edges to Faust inputs/outputs in compile order or explicit naming agreed in the per-node spec.
#   - **Parameters** → expose as input ports with `float` / `int` / `bool` / `enum` as appropriate, and/or map to
#     `hslider`/`nentry`/buttons inside `dsp` with ranges documented in the per-node markdown spec. Inspector widgets
#     follow §10 / `09-ui-components.md` parameter hints.
# - **Graph composition**: Studio connects nodes; the Faust backend either inlines subgraphs or emits a top-level
#   `process` that wires child processes. That split is owned by codegen tasks (`06-faust-codegen-single-process`,
#   `05-dsp-subgraph-extraction`) — this task defines **per-node Faust semantics and port schemas**, not the full
#   compiler.
# - **Library coverage**: map each **subcategory** below to primary Faust library families (examples):
#   Generators → `oscillators`, `noises`, `soundfiles`, `webaudio`; Envelopes → `envelopes`, `signals`;
#   Filters → `filters`, `fds`; Dynamics → `compressors`, `misceffects`; Time FX → `delays`, `reverbs`, `phaflangers`,
#   `vaeffects`; Pitch/character → `oscillators`, `misceffects`, `quantizers`; Analysis → `analyzers` (and host/UI
#   for meters/scopes where Faust is analysis-only).
#
# 3) Usefulness (why implement)
# - **High**: Reuses GRAME-maintained, well-documented DSP (`stdfaust.lib`), reduces bespoke C++/JS DSP, gives
#   predictable parameter ranges and stable symbols for codegen and MCP/docs.
# - **Medium risk / cost**: Full one-to-one coverage of every graph pattern (feedback, multi-bus, polyphony) depends
#   on codegen + runtime bridge maturity — deliver **catalog + Faust + specs** first; integrate graph-wide compile
#   incrementally per spine tasks `05`–`08`.
# - **Recommended sequencing**: ship **common sound-designer nodes** (oscillator, noise, ADSR, LP filter, gain, pan,
#   delay, reverb, compressor, chorus, distortion, LFO) before exotic or analysis-heavy nodes.
#
# 4) Documentation and spec layout (deliverables)
# - Per-node **markdown** specs under: `docs_v2/nodes/audio/defaults/` (one file per node or one index + partials;
#   minimally: inputs, outputs, parameters, Faust notes, tags, related `stdfaust` symbols).
# - Optional generated index: `docs_v2/nodes/audio/defaults/README.md` listing all nodes by category/subcategory.
# - Catalog JSON: extend `ui/editor/nodeCatalog/studio-node-catalog.json` (or a split file merged by loader
#   if size warrants) so `loadStudioNodeCatalog()` picks up definitions without breaking validation in
#   `tests/unit/studio-node-catalog.spec.ts`.
#
# 5) Taxonomy rules (from product request)
# - **category** (palette top level) = `AUDIO` for all rows in this slice (markdown H1: `# AUDIO`).
# - **subcategory** (second level) = one of the `##` sections below (e.g. `Generators`, `Envelopes and Modulation`).
# - Each node: **description**, **tags** (lowercase, search-oriented), **label** defaulting strategy per `title.ts`.
#
# ---------------------------------------------------------------------------
# Node inventory (must all receive specs + Faust-backed dsp; implement in priority order below)
#
# ## Generators
# Oscillator, Sub Oscillator, Noise, Click, Impulse, LFO, Sampler, Audio Player
#
# ## Envelopes and Modulation
# ADSR, AHDSR, Envelope Follower, Random, Sample and Hold, Slew, Glide, Macro, Mod Amount
#
# ## Filters and Tone
# Lowpass Filter, Highpass Filter, Bandpass Filter, Notch Filter, State Variable Filter, EQ, Tilt EQ, Comb Filter,
# Formant Filter, Resonator
#
# ## Gain, Mix, and Stereo DSP
# Gain, Pan, Mixer, Crossfade, Dry/Wet, Stereo Split, Stereo Merge, Mono to Stereo, Audio Switch
#
# ## Dynamics and Nonlinear
# Compressor, Limiter, Gate, Transient Shaper, Saturator, Soft Clip, Distortion, Wavefolder
#
# ## Time-Based Effects
# Delay, Ping Pong Delay, Echo, Chorus, Flanger, Phaser, Reverb, Shimmer
#
# ## Pitch and Character
# Pitch Shift, Frequency Shifter, Ring Mod, FM Operator, AM Operator, Bitcrusher, Downsampler
#
# ## Analysis
# Meter, Oscilloscope, Spectrum Analyzer, Envelope Display, Tuner, Correlation Meter
#
# ---------------------------------------------------------------------------
# Phase 1 (implement first — common sound-designer toolkit)
# Oscillator, Noise, LFO, ADSR, Lowpass Filter, Gain, Pan, Delay, Reverb, Compressor, Chorus, Flanger, Distortion,
# Sampler (basic), Meter
# ---------------------------------------------------------------------------

@large-scope
Feature: AUDIO Faust DSP node catalog from Faust Libraries index
  As a Studio maintainer
  I want a documented, Faust-based AUDIO node catalog aligned with https://faustlibraries.grame.fr/libs/
  So that sound designers get consistent palette entries, port schemas, and reusable `dsp` text per
  docs_v2/10-studio-node-ui-json-catalog.md and v2/specs/09-ui-components.md §10

  Background:
    Given the normative UI contract is din-studio/v2/specs/09-ui-components.md section 10
    And implementation notes live in docs_v2/10-studio-node-ui-json-catalog.md
    And Faust library organization reference is https://faustlibraries.grame.fr/ and https://faustlibraries.grame.fr/libs/
    And every new dsp row includes non-empty Faust source in field dsp per catalog validation rules

  Scenario: Palette taxonomy uses AUDIO category and documented subcategories
    Given catalog entries for this feature use category "AUDIO"
    Then subcategory is one of the sections in the REPORT block (Generators; Envelopes and Modulation; Filters and Tone; Gain, Mix, and Stereo DSP; Dynamics and Nonlinear; Time-Based Effects; Pitch and Character; Analysis)
    And each node lists human-readable description and normalized lowercase tags for search

  Scenario: Each node specifies inputs outputs and parameters
    Given a catalog row for a node in the inventory
    Then inputs and outputs are StudioNodePortSchema arrays with unique name values within each array
    And parameters are represented as ports and/or documented bindings to Faust controls (sliders, entries) in the per-node spec file
    And the per-node markdown under docs_v2/nodes/audio/defaults/ documents inputs params and outputs explicitly

  Scenario: Faust source traces to standard libraries
    Given dsp strings use importable Faust consistent with stdfaust / library index conventions
    When a node maps to a concrete library family (e.g. oscillators.lib, filters.lib)
    Then the per-node doc names the intended library symbols or patterns and links conceptually to the Grame index

  Scenario: Phase 1 nodes are implemented before remaining inventory
    Given Phase 1 is listed in the REPORT block
    When work starts on this task
    Then Phase 1 nodes reach validated catalog plus docs before optional nodes outside Phase 1

  Scenario: Catalog load and tests stay green
    Given definitions are merged via ui/editor/nodeCatalog/studio-node-catalog.json or an approved split-merge path
    When npm run lint typecheck test run
    Then studio-node-catalog unit tests cover new rows where applicable
    And no validation rule from validate.ts is violated for dsp nodes

  Scenario: Documentation index
    Given docs_v2/nodes/audio/defaults/ exists
    Then it contains per-node specs for delivered nodes and an index listing category subcategory name and file links
