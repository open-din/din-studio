# Task 10 — Studio node UI JSON catalog

Normative contract: `v2/specs/09-ui-components.md` section 10. This page summarizes how din-studio implements that contract in code.

## Purpose

The Studio node catalog describes **palette and React Flow UI** for editor nodes. It is **not** the DinDocument interchange model (`v2/specs/03-node-model.md`). Persisted graph instances and `.din` payloads stay separate.

## Source files

| Area | Location |
|------|----------|
| Types | `ui/editor/studioNodeCatalog/types.ts` |
| Built-in nodes (YAML) | `ui/editor/built-in-nodes/<category>/<subcategory>/*.yaml` |
| Path → category/subcategory helpers | `ui/editor/studioNodeCatalog/loadBuiltInNodeFiles.ts` |
| JSON defaults on load | `ui/editor/studioNodeCatalog/normalize.ts` |
| §10.5 validation | `ui/editor/studioNodeCatalog/validate.ts` |
| Merged loader (legacy bootstrap + YAML + JSON overrides) | `ui/editor/studioNodeCatalog/catalog.ts` |
| Optional overrides | `ui/editor/studioNodeCatalog/studio-node-catalog.json` (array; may be empty) |
| Legacy handle → Studio type map (not palette merge) | `ui/editor/studioNodeCatalog/legacyBootstrap.ts` |
| Default title / humanize `name` | `ui/editor/studioNodeCatalog/title.ts` |
| React Flow handle ids = port `name`s | `ui/editor/studioNodeCatalog/handles.ts` |
| Public barrel | `ui/editor/studioNodeCatalog/index.ts` |
| Palette UI | `ui/editor/components/NodePalette.tsx` |

## Loader behavior

1. Each `*.yaml` / `*.yml` under `built-in-nodes/` is loaded at build time (Vite `import.meta.glob`), parsed, and merged **by `name`**. Folder path sets `category` and `subcategory` (see `loadBuiltInNodeFiles.ts`): first segment under `built-in-nodes/` is the category slug, second segment is the subcategory slug. **Category labels:** `audio` → `AUDIO`; other slugs use title case to match the legacy palette (`sources` → `Sources`, `routing` → `Routing`, `math` → `Math`). Subcategory slugs map via `SUBCATEGORY_SLUG_TO_LABEL` or title case (e.g. `generators` → `Generators`). Inline `category` / `subcategory` in a file, if present, must match the path; path wins. The legacy `EDITOR_NODE_CATALOG` is **not** merged into the palette; it remains the source for editor node types and handles outside this catalog.
2. Entries from `studio-node-catalog.json` are normalized, validated, and merged **by `name`**, replacing any prior row when valid.
3. `loadStudioNodeCatalog()` memoizes the result. Call `resetStudioNodeCatalogCache()` in tests to reset.

## Faust `dsp` field

- Only rows with `type === 'dsp'` may carry a non-empty `dsp` string (plain Faust source for Studio hints/codegen).
- Selectors such as `getStudioDspSource` / `getStudioDspHintForEditorType` read this field only; they do **not** define DinDocument `engine` persistence.

## `customComponent`

`resolveStudioCustomComponentKey` returns `null` for the shared default shell, or a **registry key** string. The key is intended to align with the Studio UI registry (`nodeUiRegistry` / inspector patterns). Wiring the canvas node body to that key is a separate integration step; the catalog only carries the key.

## Instance labels vs catalog

Catalog `label` (or derived title from `name`) is the default for new nodes. Inspector edits to a **node instance** label update runtime/patch state only and **must not** rewrite catalog YAML/JSON definitions.

## Tests

Unit coverage: `tests/unit/studio-node-catalog.spec.ts` (normalization, validation, handle ids, titles, DSP rules).
