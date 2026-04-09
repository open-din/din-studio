# DIN Studio Docs

This folder documents the Phase 3A desktop surfaces, their panels, and the reusable design rules that support launcher and workspace flows.

## Product documentation (user guide)

End-user guide to the interface and nodes: [docs/product/README.md](./product/README.md). Contributor-facing notes remain in this `docs/` folder and in `project/features/`.

## Included Docs

- [LauncherEntryFlows](./LauncherEntryFlows.md)
- [EditorShell](./EditorShell.md)
- [SourceControlPanel](./SourceControlPanel.md)
- [CatalogExplorerPanel](./CatalogExplorerPanel.md)
- [InspectorPanel](./InspectorPanel.md)
- [RuntimeDrawer](./RuntimeDrawer.md)
- [CommandPalette](./CommandPalette.md)
- [DesignSystem](./DesignSystem.md)
- [ColorSystem](./ColorSystem.md)
- [AudioLibraryPanel](./AudioLibraryPanel.md)

## Architecture & cross-repo

- [Data flow (store → codegen → runtime)](./DataFlow.md)
- [Cross-repo dependencies](./CrossRepoDependencies.md)

## Generated API reference

`npm run docs:generate` emits TypeDoc markdown under `docs/generated/` (gitignored). Load on demand when debugging editor-core exports listed in `typedoc.json`.

## Notes

- Figma board `217:2` is the canonical Phase 3A desktop spec for these docs.
- Older editor wireframes are fallback references only when Phase 3A does not restate a behavior.
- Keep them in English so they remain usable for contributors and review tooling.
