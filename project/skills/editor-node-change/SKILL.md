# SKILL: editor-node-change

## REPO

`din-studio`

## WHEN TO USE

- Editor node metadata, UI, or code generation changes
- `ui/editor/nodeCatalog.ts` or node coverage is in scope

## STEPS

1. Read `project/ROUTE_CARD.json` and the matching item in `project/EDITOR_NODE_SLICES.json`.
2. Update the node source first, then touch shared editor files only if the slice says they are needed.
3. Keep feature docs, tests, and `project/COVERAGE_MANIFEST.json` aligned.
4. Escalate only for shared IDs, public patch surface, or round-trip changes.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
