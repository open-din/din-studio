# Cross-repo dependencies

## Purpose

Minimal map of which contracts are owned outside `din-studio`.

| Topic | Owner |
|-------|--------|
| Public `PatchDocument` schema & `@open-din/react` exports | `react-din` |
| Rust patch parity, registry, native runtime | `din-core` |
| CrewAI routing / quality gate hints | `din-agents` |

## Local development

`din-studio` depends on `file:../react-din`. Coordinate any patch shape, node id, or handle change across `react-din`, `din-core`, and this repo in the same feature branch set.

## Workspace overview

See the umbrella [`AGENTS.md`](../../AGENTS.md) in the `open-din` container (if using submodule workspace).
