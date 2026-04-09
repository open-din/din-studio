# AGENTS

Canonical project contract for Codex, Claude, Cursor, and other agents. Product context lives in `project/SUMMARY.md`, `project/USERFLOW.md`, and `project/TEST_MATRIX.md`—cite them; do not duplicate them in agent rules.

## Language

Keep English in `docs/**`, `project/**`, contributor prompts, and contributor-facing UI copy unless a scenario intentionally demonstrates locale-specific data.

## Editor nodes

- Any editor node change must stay aligned with `ui/editor/nodeCatalog.ts`, codegen paths exercised by `tests/unit/store-and-codegen.spec.ts`, the feature doc under `project/features/**`, mapped unit tests, and scenario IDs in `project/TEST_MATRIX.md`.
- `project/COVERAGE_MANIFEST.json` is the source of truth for **editor-node** coverage rows. Each item must keep `source`, `docs`, `tests`, and `scenarios` coherent.

## Product surfaces (non-node)

- Panels, launcher, source control, asset library, AI agent UI, and related flows are tracked in `project/SURFACE_MANIFEST.json` (not in the editor-node manifest).
- A visible product workflow change must update the surface doc, the relevant BDD scenario IDs in `project/TEST_MATRIX.md`, and at least one automated test (unit, integration, or e2e as appropriate).

## MCP target

- Changes under `targets/mcp/**` must keep `targets/mcp/tests/**` updated. Treat MCP tools and bridge behavior as part of the release surface.

## AI agent catalog

- Keep `ui/ai/systemPrompt.ts`, `ui/ai/tools.ts`, and `ui/editor/nodeCatalog.ts` consistent when nodes or agent capabilities change. Follow `project/skills/agent-prompt-catalog-sync/SKILL.md`.

## Required checks (pre-merge)

Run in order:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run validate:manifests`
4. `npm run validate:docs`
5. `npm run test`
6. `npm run test:e2e`

For a scoped fix that cannot run e2e locally, document why in the PR; still run steps 1–5.

## Boundaries

- Runtime patch schema and the public `@open-din/react` API are owned by the `react-din` repository—adjust that repo when changing public contracts.
- Rust patch semantics and node registry authority live in `din-core`—coordinate FFI and patch shape there.

## Documentation Strategy

- Prefer `docs/**`, `project/**`, and (on demand) `docs/generated/` from `npm run docs:generate` instead of scanning all of `ui/**` when you need editor-core API shape.
- Generated API docs are reference-only—do not load them unless needed.

## Documentation Rules

- `ui/**` public functions use JSDoc where `eslint-plugin-jsdoc` applies (warnings).
- After changing editor-core exports touched by TypeDoc entry points (`typedoc.json`), run `npm run docs:generate` and fix any new doc warnings when practical.
- Before merge, `npm run docs:generate` must succeed when TypeDoc entry points or documented exports change.

## Documentation Access Order (CRITICAL)

Always follow this sequence when gathering context. Do not skip steps.

1. This `AGENTS.md` — ownership, rules, quality gates
2. `docs/README.md` — hand-written index; use workspace `docs/README.md` when routing the whole stack
3. Workspace summary `../docs/summaries/din-studio-api.md` (when using the `open-din` container) — compressed API overview
4. `docs/generated/` from `npm run docs:generate` — reference only, at most two files at a time
5. Source under `ui/`, `core/`, `targets/` — last resort

## Context Budget Rules

- Load at most two documentation files per step; close or stop using them before opening more
- Load at most one repository’s context unless the task is explicitly cross-repo
- Prefer summaries over generated docs; prefer generated docs over source
- Never bulk-load `docs/generated/` — open only the specific module pages needed
- Minimize total loaded context at all times

## Code Reading Policy

- Do **not** read source files when documentation answers the question
- Exhaust summaries and targeted generated docs before opening `ui/` or `core/`
- When source reading is required, scope to the exact module — do not scan entire directories

## Documentation Ownership

- This repository owns `docs/`, this `AGENTS.md`, and local `docs/generated/` output
- Workspace summaries (`open-din/docs/summaries/`) must stay consistent when editor API or module boundaries change
- A public editor-core or contract-facing change is incomplete until docs and the matching summary are updated when the surface changes

## Documentation Freshness

- Regenerate docs after any change to TypeDoc entry points or documented exports (`npm run docs:generate`)
- Treat `docs/generated/` as ephemeral — do not treat stale output as authoritative
- After regeneration, decide whether `../docs/summaries/din-studio-api.md` needs an update
- Do not cite outdated documentation as authoritative
