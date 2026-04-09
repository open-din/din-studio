# SKILL: mcp-target-change

## REPO

`din-studio`

## WHEN TO USE

- `targets/mcp` changes
- Bridge, protocol-facing tests, or ws integrations change

## STEPS

1. Read the studio summary, API summary, and repo manifest.
2. Update `targets/mcp` and the exact tests that cover the changed surface.
3. Keep protocol-facing behavior stable and documented.
4. Escalate only if the MCP change depends on shared contract ownership elsewhere.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
