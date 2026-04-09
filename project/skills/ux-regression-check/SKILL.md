# SKILL: ux-regression-check

## REPO

`din-studio`

## WHEN TO USE

- A visible studio workflow changes and needs a final regression pass
- You need to confirm manifest, feature doc, and test coverage stayed aligned

## STEPS

1. Read the summary files plus the affected manifest rows.
2. Verify the visible workflow still matches the owned surface and test plan.
3. Confirm no public schema or runtime ownership drift was introduced.
4. Call out any missing automated coverage before merge.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
