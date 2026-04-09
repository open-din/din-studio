# Skill: surface-flow-change

## Triggers

- Changes to launcher, shell layout, source control, asset/catalog panels, drawers, or other non-node product surfaces.
- User flow or UX copy updates under `ui/shell/**`, `ui/ProjectLauncher.tsx`, or related routes.

## Workflow

1. Read `project/USERFLOW.md` and `project/TEST_MATRIX.md`; pick the scenario IDs that encode the intended behavior.
2. Implement UI and state changes; keep contributor copy in dedicated modules where the codebase already does so.
3. Update the feature doc under `project/features/**` for the surface.
4. Update `project/SURFACE_MANIFEST.json`: `source`, `docs`, `tests`, and `scenarios` must stay aligned.
5. Add or update at least one automated test (unit, integration, or e2e).

## Checks

- `npm run validate:manifests` and `npm run validate:docs`
- `npm run test` and affected `npm run test:e2e` cases
- `npm run docs:generate` when shell/layout entry points in `typedoc.json` change (`docs/generated/` is gitignored)

## Expected outputs

- Visible workflow changes have doc, test, matrix IDs, and manifest row updates together.
