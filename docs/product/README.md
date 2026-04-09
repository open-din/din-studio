# DIN Studio — user guide

How to use the DIN Studio interface and every node type. This section is written for **people building patches**, not for repository contributors.

## Getting oriented

| Topic | What you will learn |
|--------|---------------------|
| [Welcome](./welcome.md) | What DIN Studio is and what you can build |
| [First steps](./first-steps.md) | Launcher, projects, opening the editor |
| [Interface tour](./interface-tour.md) | Main window: rail, browse drawer, canvas, inspector, footer |
| [Building graphs](./building-graphs.md) | Adding nodes, cables, selection, transport, play |

## Working with audio and projects

| Topic | What you will learn |
|--------|---------------------|
| [Audio library](./audio-library.md) | Uploading, previewing, and reusing sound files |
| [Review and publish](./review-and-publish.md) | Source control rail, review, commit flow |
| [Recording, runtime, AI, and MIDI](./recording-runtime-ai-midi.md) | Bottom drawer tabs, diagnostics, capture, agent chat, devices |

## Node guides (by palette category)

Nodes are grouped the same way as in the editor catalog:

| Category | Guide |
|----------|--------|
| Sources | [Sources nodes](./nodes/sources.md) |
| MIDI | [MIDI nodes](./nodes/midi.md) |
| Effects | [Effects nodes](./nodes/effects.md) |
| Routing | [Routing nodes](./nodes/routing.md) |
| Math | [Math nodes](./nodes/math.md) |

[Index of all node names](./nodes/README.md)

## For contributors

Technical specs, scenarios, and architecture live elsewhere: [DIN Studio docs index](../README.md) (design notes, data flow, MCP). A compact map from feature IDs to spec files is in [Contributor reference](./contributor-reference.md).

## Screenshots

Contextual UI captures live in [`images/`](./images/README.md) (launcher, workspace, catalog, command palette, inspector, library). Regenerate Playwright shots with `CAPTURE_PRODUCT_DOCS=1` (see `images/README.md`).

## Website integration

To publish these pages on a static site, see [Website integration](./website-integration.md).
