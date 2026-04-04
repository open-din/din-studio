# Skill: ux-regression-check

## Triggers

- Before merging shell, canvas, or drawer refactors.
- After changes that might affect focus order, tabs, or e2e selectors.

## Workflow

1. Map impacted behaviors to `project/TEST_MATRIX.md` scenario IDs.
2. Run targeted e2e: `npx playwright test` with the relevant `tests/e2e/*.spec.ts` files.
3. Confirm unit coverage still passes for editor shell and shortcuts: `tests/unit/editor-shell.spec.tsx`, `tests/unit/editor-shortcuts.spec.tsx` when navigation changes.
4. If a scenario is now wrong, update the matrix status or the feature doc—do not leave contradicting docs.

## Checks

- `npm run test`
- `npm run test:e2e` (full or narrowed file list documented in PR)

## Expected outputs

- Regressions are caught or intentionally documented with matrix/feature updates.
