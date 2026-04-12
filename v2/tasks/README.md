# Task board (Gherkin)

English only. See `project/skills/v2-studio-node-codegen-refactor/SKILL.md` and `.cursor/rules/din-studio-v2-task-workflow.mdc`.

## Folders

| Folder | Meaning |
|--------|---------|
| `todo/` | Ready to implement |
| `doing/` | Work in progress (prefer one task per branch) |
| `done/` | Implemented and validated; awaiting final `docs_v2` sync before archive |
| `../v2/features/` | Completed tasks (permanent Gherkin archive) |

## User stories

Product-level scenarios live in `v2/user-stories/*.feature`. Implementable slices are `tasks/todo/*.feature`.

## Critical path (sequential spine)

The longest dependency chain for the node-system and Faust generator refactor:

`01-dindocument-editor-bridge` → `02-node-catalog-taxonomy` → `05-dsp-subgraph-extraction` → `06-faust-codegen-single-process` → `07-params-binding-manifest`

Supporting work:

- `03-graph-editor-ports-edges` follows `02` (can run in parallel with `04`–`05` once `02` types are stable).
- `04-primitives-dsp-registry` follows `02`; required before `06`.
- `08-runtime-bridge-integration` follows `06` and `01`.
- `09-mcp-codegen-contract` follows `06` (can overlap with `08`).

Dependency summary:

- `01` → `02` → `03`
- `01` + `02` → `05`; `02` → `04`; `04` + `05` → `06` → `07`
- `06` + `01` → `08`; `06` → `09`

## Parallel-safe (after shared types land)

Tag `@parallel-safe` on tasks when work is isolated (fixtures, docs-only pages, MCP contract tests that mock the generator).

- Corpus or golden tests against `open-din/v2/examples` once the editor bridge can load JSON.
- `docs_v2` pages after the task’s public API is stable.
- `03` alongside `04` / `05` after `02` lands, with agreed port/node interfaces.

## Validation

Per `project/ROUTE_CARD.json`:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
