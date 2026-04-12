# SKILL: v2-studio-node-codegen-refactor

## REPO

`din-studio`

## WHEN TO USE

- Implementing or reviewing work tracked as Gherkin tasks under `tasks/todo`, `tasks/doing`, or `tasks/done`.
- Refactoring the editor node catalog, graph store, Faust/code generation (`ui/editor/CodeGenerator.tsx` and extracted modules), or MCP/bridge codegen paths toward `v2/specs`, `open-din/v2`, and `din-core/v2/specs`.

## STEPS

1. Read `AGENTS.md`, `project/ROUTE_CARD.json`, and this skill.
2. Pick **one** task file from `tasks/todo/*.feature` and move it to `tasks/doing/`.
3. **Documentation (smallest context first, only cited paths):**
   - `project/features/70_v2_user_stories.feature.md` or `project/features/71_v2_delivery_slices.feature.md`.
   - Legacy `docs/` or root `specs/` **if** the task compares or migrates old behavior.
   - `docs_v2/<task-slug>.md` if it exists.
   - `v2/specs/*.md` **only** files referenced by the task or slice.
   - `v2/user-stories/*.feature` **only** stories the task links or needs.
   - `open-din/v2` — schema, examples, or `din-document-*.md` **cited in the task**.
   - For din-core boundaries: **only** `din-core/v2/specs` files cited in the task (validation, runtime, WASM); do not redefine ownership.
4. **TDD**: add failing tests first (unit, integration, MCP/e2e as appropriate), then implement.
5. Add or update **JSDoc** (or module docs) for all new public API in scope.
6. Add or update **`docs_v2/<task-slug>.md`** describing behavior, modules, fixtures, and how to run tests for that task.
7. Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`.
8. Move the task file from `tasks/doing/` to `tasks/done/`, then to **`v2/features/`** once documentation is complete.

## CONSTRAINTS

- **English only** for user stories, tasks, and `docs_v2`.
- Do not change persisted node identifiers or public patch schema without escalation per `AGENTS.md`.
- For small catalog-only edits without a v2 task, prefer `project/skills/editor-node-change/SKILL.md`.

## VALIDATION

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
