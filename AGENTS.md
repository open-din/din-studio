# AGENTS — din-studio

## LOAD ORDER

1. `AGENTS.md`
2. `project/ROUTE_CARD.json`
3. One matching file in `project/EDITOR_NODE_SLICES.json`, `project/MCP_TOOL_SLICES.json`, or `project/SURFACE_MANIFEST.json`
4. One matching file in `project/skills/`
5. The exact source file and exact test file

## ROUTE HERE WHEN

- The request changes editor nodes, shell workflows, launcher panels, asset flows, MCP, or code generation.
- The request changes `project/COVERAGE_MANIFEST.json` or `project/SURFACE_MANIFEST.json`.

## ROUTE AWAY WHEN

- Public API, patch schema, package exports, docs/components -> `react-din`
- Runtime, compiler, registry, migration, FFI, WASM -> `din-core`
- Workspace routing or automation -> `din-agents`

## ENTRY POINTS

- `project/ROUTE_CARD.json`
- `project/EDITOR_NODE_SLICES.json`
- `project/MCP_TOOL_SLICES.json`
- `project/SURFACE_MANIFEST.json`
- `project/features/70_v2_user_stories.feature.md`
- `project/features/71_v2_delivery_slices.feature.md`

## SKILL MAP

- v2 node/codegen refactor (Gherkin tasks) -> `project/skills/v2-studio-node-codegen-refactor/SKILL.md`
- Editor node work -> `project/skills/editor-node-change/SKILL.md`
- Surface or workflow change -> `project/skills/surface-flow-change/SKILL.md`
- MCP work -> `project/skills/mcp-target-change/SKILL.md`
- Manifest maintenance -> `project/skills/surface-manifest-update/SKILL.md`

## HARD RULES

- `din-studio` owns editor and MCP surfaces, not the public schema or runtime semantics.
- Use slice manifests before opening broad editor or MCP modules.
- Use the compact `project/features/70_*` and `71_*` indexes before opening full `v2/` or `docs_v2/` trees.
- Keep manifests, feature docs, and tests aligned.
- Escalate only for shared IDs, public patch surface, or round-trip contract changes.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
