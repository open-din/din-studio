# DIN Studio Docs

Use this folder for legacy and surface-specific narrative docs only.

## Load Order

1. `project/SUMMARY.md`
2. `project/features/70_v2_user_stories.feature.md` or `project/features/71_v2_delivery_slices.feature.md` when the task is v2-oriented
3. The exact `project/features/*.feature.md` file mapped from a manifest row or test
4. The exact file in `docs/`, `docs_v2/`, or `docs/generated/` that the task still needs

## Surface Docs

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

## Architecture

- [Data flow (store → codegen → runtime)](./DataFlow.md)
- [Cross-repo dependencies](./CrossRepoDependencies.md)

## Generated API Reference

`npm run docs:generate` emits TypeDoc markdown under `docs/generated/` (gitignored). Load those pages only for the exact exported type or interface under review.

## Notes

- `project/features/` is the compact operational index for repo-owned behavior.
- `docs_v2/` and `v2/` stay authoritative for the v2 refactor program, but should be opened file-by-file instead of tree-by-tree.
- Keep docs in English so they remain usable for contributors and review tooling.
