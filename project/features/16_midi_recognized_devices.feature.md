# 16 Recognized MIDI devices

## Feature

Recognize supported USB MIDI controllers in the MIDI Devices drawer (starting with Pioneer DDJ-XP2), surface a clear **Recognized** state, and offer **Apply preset** to scaffold `midiNote` / `midiCC` nodes in a hardware-like layout—without MIDI learn and without removing existing graph content.

### F16-S01 Recognition in the MIDI panel

**User Story** As a performer, I want my DDJ-XP2 to be clearly recognized so I know the editor can map it automatically.
**Test Layer** `e2e` via `playwright`
**UX Laws** `Selective Attention`, `Von Restorff Effect`

**Given** Web MIDI access is granted and a DDJ-XP2 input is present  
**When** I open the MIDI Devices drawer  
**Then** I see the device name, a **Recognized** badge, and **Apply preset** on the connected input row

### F16-S02 Apply preset scaffolds the graph

**User Story** As a performer, I want one action to drop a full mapping scaffold onto the canvas.
**Test Layer** `e2e` via `playwright`
**UX Laws** `Doherty Threshold`

**Given** a recognized controller input is connected  
**When** I click **Apply preset**  
**Then** the graph gains the expected number of MIDI scaffold nodes

### F16-S03 Mapping correctness

**User Story** As a performer, I need pad nodes bound to the right device and notes so they respond to my hardware.
**Test Layer** `e2e` via `playwright`
**UX Laws** `Postel's Law`

**Given** I applied the DDJ-XP2 preset  
**When** I inspect a scaffolded pad node  
**Then** its MIDI input id and note match the profile (best-effort until verified against Pioneer docs)

### F16-S04 Spatial layout

**User Story** As a performer, I want left/right hardware regions reflected on the canvas.
**Test Layer** `e2e` via `playwright`
**UX Laws** `Spatial Memory`

**Given** I applied the DDJ-XP2 preset  
**When** I compare average positions of left vs right pad labels  
**Then** the two clusters are clearly separated horizontally

### F16-S05 Non-destructive apply

**User Story** As a contributor, I must not lose work when adding a hardware scaffold.
**Test Layer** `e2e` via `playwright`
**UX Laws** `Jakob's Law`

**Given** the graph already has nodes (for example the default chain)  
**When** I apply a device preset  
**Then** all prior nodes remain

### Integration coverage

`F16-S06` and `F16-S07` document Vitest coverage for profile matching, layout math, batched store scaffold, and panel UI wiring listed in `project/TEST_MATRIX.md`.

### v1 scope and limitations

- **Supported hardware (v1):** Pioneer DDJ-XP2 only.
- **MIDI note and CC tables** in code are marked with `TODO: verify against official Pioneer MIDI spec`; validate with real hardware or learn capture before treating them as definitive.
- **Not in v1:** other controllers, partial apply, preview layout, auto-wiring to synth parameters.

### Related

- Base MIDI drawer behavior: `project/features/15_midi_device_panel.feature.md`.
