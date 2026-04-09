# SKILL: surface-flow-change

## REPO

`din-studio`

## WHEN TO USE

- A visible workflow, panel, launcher, or asset flow changes
- `project/SURFACE_MANIFEST.json` should move with the request

## STEPS

1. Read the summary files and `project/SURFACE_MANIFEST.json`.
2. Update the owned UI workflow in `ui/shell`, `ui/editor`, or related modules.
3. Update manifest rows, feature docs, and automated tests together.
4. Keep public schema and runtime concerns out of studio unless explicitly shared.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
