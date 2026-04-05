# 15 MIDI Device Panel

## Feature

Centralize Web MIDI access, port listing, default input/output selection, and drag-to-graph device assignment from a dedicated left-rail panel aligned with DIN Studio graph authoring.

### F41-S01 Left rail opens MIDI Devices drawer

**User Story** As a contributor, I want a dedicated MIDI entry on the activity rail so I can manage devices without hunting through node widgets.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Jakob's Law`, `Selective Attention`

**Given** the editor project shell is open
**When** the contributor selects the MIDI activity
**Then** the left drawer shows the MIDI Devices surface with connect affordances

### F41-S02 Connect MIDI surfaces port list

**User Story** As a contributor, I want granted MIDI access to list inputs and outputs so I can assign hardware to the graph.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Doherty Threshold`, `Postel's Law`

**Given** the browser exposes Web MIDI and the user approves access
**When** the contributor connects MIDI from the panel
**Then** inputs and outputs appear with clear labels and drag hints

### F41-S07 Connected device count on the rail

**User Story** As a contributor, I want a quick count of active ports so I know MIDI is live before opening the drawer.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Selective Attention`, `Von Restorff Effect`

**Given** MIDI access is granted and ports exist
**When** the contributor returns to the shell chrome
**Then** the MIDI rail badge reflects the number of listed ports

### Integration coverage

Vitest scenarios `F41-S10`–`F41-S19` cover panel copy, defaults, drag payloads, store overrides, preference persistence, and shell navigation wiring documented in `project/TEST_MATRIX.md`.
