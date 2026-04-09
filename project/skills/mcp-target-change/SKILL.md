# Skill: mcp-target-change

## Triggers

- Changes under `targets/mcp/**` (server, runtime, bridge, packaging).
- New MCP tools, protocol fields, or tests touching `targets/mcp/tests/**`.

## Workflow

1. Read `project/features/14_mcp_server_target.feature.md` and `project/TEST_MATRIX.md` scenario IDs `F14-S01`, `F14-S02`.
2. Implement changes in `targets/mcp/src/**`; keep the entry `targets/mcp/src/index.ts` coherent with packaging.
3. Extend `targets/mcp/tests/runtime.spec.ts` and/or `targets/mcp/tests/bridge-server.spec.ts` for new behavior.
4. Update `project/SURFACE_MANIFEST.json` item `mcp-target:StudioMcp` if primary paths or tests shift.
5. Run MCP-target tests: `npm run test:mcp`.

## Checks

- `npm run test:mcp`
- `npm run validate:manifests`
- `npm run docs:generate` if MCP TypeDoc entry points or exports changed (`docs/generated/` is gitignored)

## Expected outputs

- MCP behavior, bridge contracts, and tests move together; no unmapped server surface.
