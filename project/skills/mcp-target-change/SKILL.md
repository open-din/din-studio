# SKILL: mcp-target-change

## REPO

`din-studio`

## WHEN TO USE

- `targets/mcp` changes
- Bridge, protocol-facing tests, or ws integrations change

## STEPS

1. Read `project/ROUTE_CARD.json`, `project/features/71_v2_delivery_slices.feature.md` when codegen parity is in scope, and `project/MCP_TOOL_SLICES.json`.
2. Update `targets/mcp/src/runtime.ts` and the exact tests that cover the changed tool or transport surface.
3. Keep protocol-facing behavior stable and documented.
4. Escalate only if the MCP change depends on shared contract ownership elsewhere.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
