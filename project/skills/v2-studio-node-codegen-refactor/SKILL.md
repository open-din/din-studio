# SKILL: v2-studio-node-codegen-refactor

## REPO

`din-studio`

## WHEN TO USE

- Implementing or reviewing work tracked as Gherkin tasks under `tasks/todo`, `tasks/doing`, or `tasks/done`.
- Refactoring the editor node catalog, graph store, Faust/code generation (`ui/editor/CodeGenerator.tsx` and extracted modules), or MCP/bridge codegen paths toward `v2/specs`, `open-din/v2`, and `din-core/v2/specs`.

## STEPS

1. Read `AGENTS.md`, `project/ROUTE_CARD.json`, and this skill.
2. Pick **one** task file from `tasks/todo/*.feature` and move it to `tasks/doing/`.
3. Read linked sections in `v2/specs` and the relevant `open-din/v2` schema or examples cited in the task `Background`.
4. For din-core integration points, read the cited `din-core/v2/specs` paths (validation, runtime, WASM) without redefining ownership.
5. **TDD**: add failing tests first (unit, integration, MCP/e2e as appropriate), then implement.
6. Add or update **JSDoc** (or module docs) for all new public API in scope.
7. Add or update **`docs_v2/<task-slug>.md`** describing behavior, modules, fixtures, and how to run tests for that task.
8. Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`.
9. Move the task file from `tasks/doing/` to `tasks/done/`, then to **`v2/features/`** once documentation is complete.

## CONSTRAINTS

- **English only** for user stories, tasks, and `docs_v2`.
- Do not change persisted node identifiers or public patch schema without escalation per `AGENTS.md`.
- For small catalog-only edits without a v2 task, prefer `project/skills/editor-node-change/SKILL.md`.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
