# Skill: editor-node-change

## Triggers

- Add, remove, or modify an editor node type.
- Prompts mentioning `nodeCatalog`, node UI under `ui/editor/nodes/`, codegen, or patch round-trip from the studio side.

## Workflow

1. Read `project/SUMMARY.md` and `project/TEST_MATRIX.md` for scenario IDs that apply to the node family.
2. Update `ui/editor/nodeCatalog.ts` and the node component under `ui/editor/nodes/**`.
3. Extend or adjust codegen coverage via `tests/unit/store-and-codegen.spec.ts` and any affected graph builders.
4. Update the feature doc in `project/features/**` and add or adjust `project/COVERAGE_MANIFEST.json` (`source`, `docs`, `tests`, `scenarios`).
5. If the agent or MCP exposes the node, follow `project/skills/agent-prompt-catalog-sync/SKILL.md`.

## Checks

- `npm run validate:manifests`
- `npm run test` (unit + MCP unit)
- Relevant e2e if the node changes visible authoring flows (`npm run test:e2e`)

## Expected outputs

- PR completes catalog, docs, manifest row, tests, and scenario IDs with no orphan references.
- `AGENTS.md` rules remain satisfied.
