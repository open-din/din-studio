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
