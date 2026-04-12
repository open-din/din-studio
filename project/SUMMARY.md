# SUMMARY

## PURPOSE

Standalone DIN editor, shell, MCP target, and code generation workspace.

## OWNS

- Editor graph workflows and node catalog UX
- Shell, launcher, panel, and asset flows
- MCP target behavior and tests
- `project/COVERAGE_MANIFEST.json` and `project/SURFACE_MANIFEST.json`
- Compact routing docs under `project/features/`

## DOES NOT OWN

- Public patch schema, package exports, or docs/components
- Rust runtime semantics, registry, or migration behavior
- Workspace routing and automation

## USE WHEN

- The task changes editor UI, node metadata, shell flows, MCP, or studio manifests.
- The task needs a compact overview of v2 user stories or v2 delivery slices before opening `v2/` or `docs_v2/`.

## DO NOT USE WHEN

- The task is public API or schema publishing -> `react-din`
- The task is runtime or registry work -> `din-core`
- The task is routing or control-plane work -> `din-agents`

## RELATED REPOS

- `react-din` owns public patch types and exports
- `din-core` owns runtime semantics and registry authority
- `din-agents` routes workspace ownership and quality gates

## COMPACT DOC ENTRY

- Start with `project/features/70_v2_user_stories.feature.md` for v2 intent.
- Use `project/features/71_v2_delivery_slices.feature.md` to route into the right v2 task/spec/doc without loading whole trees.
