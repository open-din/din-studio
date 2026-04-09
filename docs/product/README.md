# DIN Studio — product documentation

End-user and stakeholder-oriented product docs derived from [BDD feature scenarios](../../project/features/) and linked to [contributor surface docs](../README.md). Scenario IDs and file names stay aligned with `project/TEST_MATRIX.md`.

## Start here

| Page | Audience |
|------|----------|
| [Overview](./overview.md) | What DIN Studio is for and how this doc set is organized |
| [Editor & workspace](./editor-workspace.md) | Shell, graph lifecycle, canvas, system actions |
| [Inspector & code generation](./inspector-and-codegen.md) | Selection, parameters, generated code |
| [Playground & integration](./playground-and-integration.md) | Node UX rules and integrated graph scenarios |
| [Assets & library](./assets-and-library.md) | Audio library and catalog-driven workflows |
| [Projects, launcher & source control](./projects-launcher-and-source-control.md) | Entry flows, Git/review surfaces |
| [AI, MCP & MIDI](./ai-mcp-and-midi.md) | Agent panel, MCP target, MIDI device panel |
| [Session recording](./session-recording.md) | Graph output capture and export |
| [Node reference (by palette)](./nodes/index.md) | All editor nodes → feature specs |

## Design & architecture (contributor docs)

- [Design system](../DesignSystem.md), [color system](../ColorSystem.md)
- [Data flow](../DataFlow.md), [cross-repo dependencies](../CrossRepoDependencies.md)
- Panel deep dives: [Editor shell](../EditorShell.md), [launcher](../LauncherEntryFlows.md), [command palette](../CommandPalette.md), [catalog explorer](../CatalogExplorerPanel.md), [audio library](../AudioLibraryPanel.md), [inspector](../InspectorPanel.md), [runtime drawer](../RuntimeDrawer.md), [source control](../SourceControlPanel.md), [MCP](../MCP.md)

## Website integration

For static-site generators, see [Website integration notes](./website-integration.md).

---

**Repository root:** treat paths like `../../project/features/05_editor_shell_and_navigation.feature.md` as stable links from this folder.
