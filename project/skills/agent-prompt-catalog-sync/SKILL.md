# SKILL: agent-prompt-catalog-sync

## REPO

`din-studio`

## WHEN TO USE

- Agent-facing node catalog output changes
- `ui/ai/*` or `ui/editor/nodeCatalog.ts` must stay in sync

## STEPS

1. Read the studio summary, `project/features/71_v2_delivery_slices.feature.md` if the change is v2-related, the API summary, and the repo manifest.
2. Update catalog metadata, prompt-facing summaries, and any AI tool surface touched.
3. Keep agent-facing output aligned with the actual node catalog and manifests.
4. Avoid introducing schema or runtime ownership drift from studio.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
