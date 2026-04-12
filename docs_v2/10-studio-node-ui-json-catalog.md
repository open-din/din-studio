# Task: Studio node UI JSON catalog

## Scope

Define and implement the **Studio-only** node catalog JSON contract (palette, React Flow ports, inspector copy, optional Faust `dsp` string). This is **not** DinDocument / `.din` interchange; it complements persisted graph data in the editor.

## Normative spec

- `v2/specs/09-ui-components.md` — §10 Studio node catalog JSON (UI contract)
- `v2/specs/03-node-model.md` — §8 Studio node UI JSON vs `.din` persistence

## Goals

1. **Types** — `StudioNodeDefinition`, `StudioNodePortSchema`, `StudioNodeType`, `StudioNodePortValueType`, `StudioNodePortInterface`; independent from `AudioNodeData` and DinDocument types.
2. **Loader** — Single normalizer over JSON definitions with defaults (`label: null`, `customComponent: null`, `tags: []`, `inputs: []`, `outputs: []`).
3. **UI** — Handles from `inputs`/`outputs`; palette from `category` / `subcategory` / `tags`; default title `label ?? humanize(name)`; `customComponent` → existing registry.
4. **Migration** — Replace split catalog tables (`EDITOR_NODE_CATALOG`, default handles, ad hoc taxonomy) without changing instance-level inspector label behavior or `.din` shapes.

## Public surfaces (when implemented)

Document exports and module paths here as APIs land (per agent workflow: JSDoc + this page).

## Task file

- `tasks/todo/10-studio-node-ui-json-catalog.feature` — Gherkin acceptance scenarios
