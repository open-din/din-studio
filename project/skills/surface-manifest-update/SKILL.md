# Skill: surface-manifest-update

## Triggers

- New studio surface, renamed primary source file, or changed scenario ownership for non-node features.
- Touching `project/SURFACE_MANIFEST.json` or adding a feature doc for shells, launcher, MCP, or AI.

## Workflow

1. Add or edit the `studio-surface` or `mcp-target` item:
   - `id`: `surface:<Name>` or `mcp-target:<Name>` matching `name`.
   - `kind`: `studio-surface` or `mcp-target`.
   - `source`: primary implementation file.
   - `docs`: `project/features/*.feature.md` with `## Feature`.
   - `tests`: at least one existing test path.
   - `scenarios`: IDs that already exist in `project/TEST_MATRIX.md` (add matrix rows first if needed).
2. Run `node ./scripts/validate-manifests.mjs` locally.
3. Do not register editor nodes here—use `project/COVERAGE_MANIFEST.json`.

## Checks

- `npm run validate:manifests`
- `npm run validate:docs`
- `npm run docs:generate` when documented surfaces map to TypeDoc entry files (`docs/generated/` is gitignored)

## Expected outputs

- Manifest, matrix, docs, and filesystem paths cross-validate with zero orphan scenario IDs.
