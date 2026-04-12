# UI component registry

## 1. Principle

The **end-user interface** of din-studio is **React**, not Faust’s generated UI.

Faust widgets supply **metadata** (paths, ranges, grouping) but **do not** drive the editor’s primary control rendering.

## 2. Component references in `.din`

Nodes MAY declare UI bindings:

| Field | Purpose |
|-------|---------|
| `ui.nodeComponent` | Canvas node body |
| `ui.inspectorComponent` | Right-hand inspector panel |
| `ui.drawerComponent` | Deep-edit drawer / modal |
| `ui.widgetComponent` | Inline parameter widget override |
| `ui.portComponent` | Custom port handle |

Example keys (illustrative):

- `Knob`, `Slider`, `Toggle`, `Select`
- `OscillatorNode`, `SamplerNode`, `FaustNodeDrawer`

## 3. Registry architecture

din-studio maintains a **registry** mapping string keys → React components:

- Loaded at editor bootstrap (`nodeUiRegistry` pattern).
- Keys SHOULD be stable across releases once published.

## 4. Inspector layout

Inspector sections (recommended order):

1. **Identity** — name, id, kind
2. **Parameters** — mapped from `params[]`
3. **Ports** — read-only listing with connection status
4. **Engine** — Faust source viewer, compile status, errors
5. **Advanced** — JSON debug / export

## 5. Parameter widgets

Mapping hints:

| `dataType` | Default widget |
|------------|----------------|
| `float` (log scale) | Exponential knob |
| `float` (linear) | Slider |
| `int` | Stepped slider |
| `bool` | Toggle |
| `enum` | Select |
| `event` | Button / trigger |

## 6. Faust code editor

For `engine.backend: faust`:

- Monaco or CodeMirror with Faust syntax highlighting (host choice).
- Inline **compile** button triggers codegen pipeline.
- Surface diagnostics from compiler WASM CLI or server.

## 7. Theming

- Use design tokens (`node_ui_tokens` feature docs in repo).
- Node colors derive from `type` / `kind` maps for visual grouping.

## 8. Accessibility

- Param widgets MUST expose labels and keyboard focus order.
- Color MUST NOT be the only connection validity indicator.

## 9. Cross-repo note

Public **react-din** components MAY be reused for preview or embed mode; din-studio-specific chrome stays in this repo.

## 10. Studio node catalog JSON (UI contract)

### 10.1 Purpose

The **DIN Studio V2 node UI JSON** format defines the **Studio-internal** interface contract for the React Flow node system. It describes:

- node identity and presentation metadata
- React Flow input/output ports (shared port schema for both directions)
- inspector-facing labels and descriptions
- category placement in the Studio palette
- optional Studio UI component overrides (`customComponent`)
- optional **plain Faust source** on `dsp` nodes (`dsp` field)

This format is **Studio-only**. It does **not** define the `.din` file schema, runtime session model, or interchange contract with `din-core`. Persisted graph instances and DinDocument node payloads remain governed by [03-node-model.md](./03-node-model.md) and core specs.

### 10.2 Node definition (example)

```json
{
  "name": "oscillator",
  "label": null,
  "description": "Basic sine oscillator.",
  "type": "dsp",
  "inputs": [
    {
      "type": "float",
      "name": "frequency",
      "interface": "slider"
    }
  ],
  "outputs": [
    {
      "type": "audio",
      "name": "out",
      "interface": "input"
    }
  ],
  "customComponent": null,
  "tags": ["oscillator", "source", "faust"],
  "category": "Sources",
  "subcategory": "Oscillators",
  "dsp": "process = os.oscsin(hslider(\"freq\", 440, 20, 20000, 1));"
}
```

### 10.3 Node fields

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `name` | `string` | yes | Stable Studio identifier; **unique** within the catalog; machine-friendly across releases. |
| `label` | `string \| null` | yes | Default `null` — Studio derives display from `name` when null. Instance-level inspector label overrides win over catalog. |
| `description` | `string` | yes | Palette, inspector, help surfaces. |
| `type` | enum | yes | Studio UI taxonomy: `dsp`, `interface`, `value`, `transport`, `timeline`, `voice`, `asset`. **Not** a `.din` schema field. |
| `inputs` | `NodePortSchema[]` | yes | Target ports → React Flow **target** handles. |
| `outputs` | `NodePortSchema[]` | yes | Source ports → React Flow **source** handles. |
| `customComponent` | `string \| null` | yes | Default `null` — default shared node shell. Otherwise a **registry key** for a custom React node UI. |
| `tags` | `string[]` | yes | Search/filter; SHOULD be normalized **lowercase**. |
| `category` | `string` | yes | Top-level palette group. |
| `subcategory` | `string` | yes | Second-level group within `category`. Free-form strings (not fixed enums). |
| `dsp` | `string` | conditional | **Required** when `type === "dsp"` (non-empty string). **Forbidden** when `type !== "dsp"`. Plain Faust source only; Studio metadata — does not define `.din` `engine` persistence. |
| `editableInputsParams` | `boolean` | no | Default `false`. When `true`, the inspector may edit this node instance’s input port list (`studioPortOverrides.inputs` in graph state). |
| `editableOutputsParams` | `boolean` | no | Default `false`. When `true`, the inspector may edit this node instance’s output port list (`studioPortOverrides.outputs` in graph state). |

### 10.4 Port schema (`NodePortSchema`)

Example:

```json
{
  "type": "float",
  "name": "frequency",
  "interface": "slider"
}
```

| Field | Type | Required | Allowed values / rules |
|-------|------|----------|-------------------------|
| `type` | enum | yes | `int`, `float`, `audio`, `trigger`, `bool`, `enum`. YAML may use `number` as an alias for `float` (normalized at load). |
| `name` | `string` | yes | Stable port id; **unique** within the local `inputs` array or local `outputs` array. |
| `interface` | enum | yes | `input`, `slider`, `checkbox` — default Studio UI treatment. **Same schema** for inputs and outputs. On outputs, `interface` is **metadata only**; Studio MAY ignore UI-oriented hints at render time. |
| `default` | `number` | no | For `int` / `float` ports: default control value in the canvas shell / inspector. |
| `min` | `number` | no | For `int` / `float`: range lower bound (with `max`, must satisfy `min <= max`). |
| `max` | `number` | no | For `int` / `float`: range upper bound. |
| `step` | `number` | no | For `int` / `float`: step for sliders/number fields. |
| `enumOptions` | `string[]` | conditional | **Required** when `type === "enum"` (non-empty). |
| `enumDefault` | `string` | no | For `enum`: must be one of `enumOptions` when both are set. |

### 10.5 Validation rules

Studio validation MUST enforce:

- `name`, `description`, `category`, `subcategory` are non-empty strings.
- `label` is `null` or a non-empty string.
- `customComponent` is `null` or a non-empty registry key string.
- `tags` is an array of non-empty strings.
- `inputs` and `outputs` are arrays (may be empty).
- Each port has valid `type`, `name`, and `interface`.
- Port names are unique within `inputs` and within `outputs`.
- `dsp` is present only for `type: "dsp"` and is a non-empty string; absent for all other `type` values.

### 10.6 Rendering and behavior

- React Flow handle ids MUST map **1:1** to `inputs[].name` and `outputs[].name`.
- Palette uses `category`, `subcategory`, `tags`, `label`, and `description`.
- Default node shell: title = `label ?? humanize(name)`; help/tooltip from `description`; `customComponent` resolves optional override in the Studio registry.
- Inspector **instance** label editing is separate from catalog JSON and MUST NOT mutate catalog definitions.
- This schema defines the **catalog and UI contract**, not saved graph instances.

### 10.7 TypeScript types (Studio-facing)

```ts
type StudioNodeType =
  | "dsp"
  | "interface"
  | "value"
  | "transport"
  | "timeline"
  | "voice"
  | "asset";

type StudioNodePortValueType =
  | "int"
  | "float"
  | "audio"
  | "trigger"
  | "bool"
  | "enum";

type StudioNodePortInterface =
  | "input"
  | "slider"
  | "checkbox";

interface StudioNodePortSchema {
  type: StudioNodePortValueType;
  name: string;
  interface: StudioNodePortInterface;
}

interface StudioNodeDefinition {
  name: string;
  label: string | null;
  description: string;
  type: StudioNodeType;
  inputs: StudioNodePortSchema[];
  outputs: StudioNodePortSchema[];
  customComponent: string | null;
  tags: string[];
  category: string;
  subcategory: string;
  dsp?: string;
}
```

### 10.8 Implementation notes

- Introduce `StudioNodeDefinition` / `StudioNodePortSchema` as the **canonical** catalog input; keep types independent from `AudioNodeData` and DinDocument types.
- Replace split catalog sources (`EDITOR_NODE_CATALOG`, default handles, ad hoc taxonomy) with a **loader/normalizer** over JSON and/or YAML definitions (see §10.10); normalize defaults: `label: null`, `customComponent: null`, `tags: []`, `inputs: []`, `outputs: []`.
- **Migration** is Studio-catalog-only, not a `.din` migration; preserve instance behavior and inspector overrides in graph state.

### 10.9 Defaults and assumptions

- Catalog JSON is **never** reused as the `.din` node schema.
- `dsp` is a **single string** of Faust source, not an object.
- `inputs` and `outputs` share one port schema for implementation simplicity.
- `category` / `subcategory` stay free-form to limit palette churn.

### 10.10 Built-in catalog nodes (YAML)

din-studio MAY ship built-in catalog rows as **one file per node** under `ui/editor/built-in-nodes/`, using the same field model as §10.3 (YAML maps to the same shape as JSON). Typical layout:

- `built-in-nodes/<category-slug>/<subcategory-slug>/<name>.yaml`

Examples: `built-in-nodes/audio/generators/osc.yaml` (Faust `dsp`, category `AUDIO`), `built-in-nodes/sources/transport/transport.yaml` (category `Sources`), `built-in-nodes/routing/buses/mixer.yaml` (category `Routing`), `built-in-nodes/math/general/math.yaml` (category `Math`).

The loader derives `category` and `subcategory` strings from folder names (with documented slug→label rules); optional `studio-node-catalog.json` remains a **merge overlay** by `name` for hotfixes or experiments without editing many files.
