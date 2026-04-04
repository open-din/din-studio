# Contributor Flow

1. Pick the DIN Studio surface or editor node that needs to change.
2. Update the implementation and any linked editor integration touch points.
3. Update the mapped documentation under `docs/**` or `docs/editor-nodes/**`.
4. Update at least one mapped automated test file and keep the relevant BDD scenario IDs current.
5. If the item is new, register it everywhere required: editor nodes go in `project/COVERAGE_MANIFEST.json`; launcher, panels, AI UI, and MCP surfaces go in `project/SURFACE_MANIFEST.json`.
6. Run the DIN Studio automated tests and validation checks before review (`project/SUMMARY.md` and `project/TEST_MATRIX.md` stay the narrative sources—cite them rather than duplicating them in new docs).
