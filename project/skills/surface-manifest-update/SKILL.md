# SKILL: surface-manifest-update

## REPO

`din-studio`

## WHEN TO USE

- `project/SURFACE_MANIFEST.json` or `project/COVERAGE_MANIFEST.json` drifts from the implementation
- A visible surface or node entry is added, removed, or renamed

## STEPS

1. Read `project/ROUTE_CARD.json` and the target manifest.
2. Update the exact row for the changed surface, source, docs, tests, and scenarios.
3. Remove orphan rows and keep manifest scope limited to studio-owned surfaces.
4. Escalate only if the manifest change exposes a shared contract mismatch.

## VALIDATION

- `npm run validate:manifests`
- `npm run test`
