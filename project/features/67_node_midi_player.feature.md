# 67 MIDI Player Node

## Feature

Define the MIDI Player node as a stable, testable DIN Editor contract: pick MIDI assets from the library (or import), accept **transport** clock input, and emit **trigger** pulses in sync when a file is loaded.

### F67-S01 MIDI Player node is discoverable and placeable from the MIDI catalog

**User Story** As a contributor, I want to place the MIDI Player from the MIDI catalog so I can wire transport-driven triggers without hunting for hidden tools.

**Given** a contributor opens the MIDI category in the node catalog

**When** they add MIDI Player to the canvas

**Then** the node appears with the expected label and defaults

### F67-S02 MIDI Player node exposes transport input and trigger output handles on the canvas

**User Story** As a contributor, I want clear **transport** and **trigger** handles so I can connect the global transport and downstream trigger targets confidently.

**Given** a MIDI Player node is on the canvas

**When** the contributor inspects the node handles

**Then** **transport** (target) and **trigger** (source) handles are visible and addressable

### Library integration (F10-S04–S06)

Library **Audio**, **Convolvers**, and **MIDI** tabs filter assets by kind; imports route **audio** samples, **impulse** responses, and **MIDI** files into the correct on-disk folders and tabs.
