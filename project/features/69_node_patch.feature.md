# 69 Patch Node

## Feature

Define the Patch node as a stable DIN Editor contract for nested graph reuse: contributors select a patch source (asset or sibling graph), then the node derives its boundary handles and metadata from that source instead of freeform slot editing.

### F69-S01 Patch node is discoverable and placeable from the Sources catalog

**User Story** As a contributor, I want to add the Patch node directly from Sources so nested graph authoring stays part of the normal canvas workflow.

**Given** the contributor opens the Sources category in the node catalog

**When** they add Patch to the canvas

**Then** a Patch node appears with default empty-source state and implicit audio handles

### F69-S02 Patch node derives source-specific handles after selecting a sibling graph or patch asset

**User Story** As a contributor, I want Patch handles to mirror the selected source contract so I can wire nested boundaries without guessing slot names.

**Given** a Patch node is on the canvas and patch sources are available

**When** the contributor selects a sibling graph or patch asset source

**Then** the node stores source metadata and renders derived `in:<slot>` / `out:<slot>` handles from the source interface

### F69-S03 Patch source sync revalidates stale edges when boundary handles change

**User Story** As a contributor, I want stale edges removed when the selected patch source changes so the graph cannot keep invalid hidden wiring.

**Given** existing edges target or source Patch boundary handles

**When** source sync updates the Patch boundary metadata

**Then** incompatible edges are revalidated and dropped while valid wiring remains
