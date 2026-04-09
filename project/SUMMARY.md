# SUMMARY

## PURPOSE

Standalone DIN editor, shell, MCP target, and code generation workspace.

## OWNS

- Editor graph workflows and node catalog UX
- Shell, launcher, panel, and asset flows
- MCP target behavior and tests
- `project/COVERAGE_MANIFEST.json` and `project/SURFACE_MANIFEST.json`

## DOES NOT OWN

- Public patch schema, package exports, or docs/components
- Rust runtime semantics, registry, or migration behavior
- Workspace routing and automation

## USE WHEN

- The task changes editor UI, node metadata, shell flows, MCP, or studio manifests.

## DO NOT USE WHEN

- The task is public API or schema publishing -> `react-din`
- The task is runtime or registry work -> `din-core`
- The task is routing or control-plane work -> `din-agents`

## RELATED REPOS

- `react-din` owns public patch types and exports
- `din-core` owns runtime semantics and registry authority
- `din-agents` routes workspace ownership and quality gates
