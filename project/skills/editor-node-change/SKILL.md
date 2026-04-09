# SKILL: editor-node-change

## REPO

`din-studio`

## WHEN TO USE

- Editor node metadata, UI, or code generation changes
- `ui/editor/nodeCatalog.ts` or node coverage is in scope

## STEPS

1. Read `project/SUMMARY.md`, `../docs/summaries/din-studio-api.md`, and `project/REPO_MANIFEST.json`.
2. Update node catalog metadata and the affected editor modules.
3. Keep feature docs, tests, and `project/COVERAGE_MANIFEST.json` aligned.
4. Escalate only for shared IDs, public patch surface, or round-trip changes.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
