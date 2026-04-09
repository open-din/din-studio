# AGENTS — din-studio

## LOAD ORDER

1. `AGENTS.md`
2. `project/SUMMARY.md`
3. `../docs/summaries/din-studio-api.md`
4. `project/REPO_MANIFEST.json`
5. One matching file in `project/skills/`

## ROUTE HERE WHEN

- The request changes editor nodes, shell workflows, launcher panels, asset flows, MCP, or code generation.
- The request changes `project/COVERAGE_MANIFEST.json` or `project/SURFACE_MANIFEST.json`.

## ROUTE AWAY WHEN

- Public API, patch schema, package exports, docs/components -> `react-din`
- Runtime, compiler, registry, migration, FFI, WASM -> `din-core`
- Workspace routing or automation -> `din-agents`

## ENTRY POINTS

- `ui/editor/nodeCatalog.ts`
- `targets/mcp`
- `project/COVERAGE_MANIFEST.json`
- `project/SURFACE_MANIFEST.json`

## SKILL MAP

- Editor node work -> `project/skills/editor-node-change/SKILL.md`
- Surface or workflow change -> `project/skills/surface-flow-change/SKILL.md`
- MCP work -> `project/skills/mcp-target-change/SKILL.md`
- Manifest maintenance -> `project/skills/surface-manifest-update/SKILL.md`

## HARD RULES

- `din-studio` owns editor and MCP surfaces, not the public schema or runtime semantics.
- Keep manifests, feature docs, and tests aligned.
- Escalate only for shared IDs, public patch surface, or round-trip contract changes.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
