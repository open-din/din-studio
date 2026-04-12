# Contributor Flow

1. Pick the DIN Studio surface or editor node that needs to change.
2. Start from the smallest routing doc that fits the change:
   `project/features/70_v2_user_stories.feature.md` for v2 intent,
   `project/features/71_v2_delivery_slices.feature.md` for task routing,
   then only the exact `v2/specs` or `docs_v2` file the change cites.
3. Update the implementation and any linked editor integration touch points.
4. Update the mapped documentation under `project/features/`, `docs/`, or `docs_v2/` without duplicating the same intent in multiple folders.
5. Update at least one mapped automated test file and keep the relevant BDD scenario IDs current.
6. If the item is new, register it everywhere required: editor nodes go in `project/COVERAGE_MANIFEST.json`; launcher, panels, AI UI, and MCP surfaces go in `project/SURFACE_MANIFEST.json`.
7. Run the DIN Studio automated tests and validation checks before review (`project/SUMMARY.md` and `project/TEST_MATRIX.md` stay the narrative sources—cite them rather than duplicating them in new docs).
