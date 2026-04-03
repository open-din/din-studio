# 02 DIN Editor Nodes

## Feature

Keep every DIN Editor node registered, documented, and testable across UI, store, engine, and code generation touch points.

## Review Invariants

- Outputs render at the top-right of the node.
- Inputs render at the bottom-left of the node.
- No node uses sockets on the top or bottom border.
- Each socket gets its own visible row and the socket stays centered on the node border edge.
- If an input handle is connected, the node shows a live read-only value and hides the editable control.
- Nodes do not use helper paragraphs or empty-state prose inside the card body.
- `StepSequencer` and `PianoRoll` must remain comfortably editable with a mouse as step counts grow.
- `StepSequencer` and `PianoRoll` must show a luminous active playback column.

### F02-S01 Source, effect, and routing nodes stay aligned

**Given** a contributor changes a DIN Editor source, effect, or routing node
**When** the change lands
**Then** registry, defaults, docs, and mapped tests remain aligned

### F02-S02 Data and control nodes keep their contracts

**Given** a contributor changes `InputNode`, `NoteNode`, `MathNode`, `CompareNode`, `MixNode`, `ClampNode`, or `SwitchNode`
**When** the node data contract changes
**Then** handles, defaults, code generation, docs, and tests are updated together

### F02-S03 Timing and voice nodes remain integration-safe

**Given** a contributor changes `TransportNode`, `StepSequencerNode`, `PianoRollNode`, `LFONode`, `ADSRNode`, or `VoiceNode`
**When** the change is reviewed
**Then** graph execution, code generation, docs, tests, editing dimensions, and active-step feedback stay consistent

### F02-S04 MIDI nodes stay aligned

**Given** a contributor changes `MidiNoteNode`, `MidiCCNode`, `MidiNoteOutputNode`, `MidiCCOutputNode`, or `MidiSyncNode`
**When** the node contract changes
**Then** handles, defaults, code generation, docs, and tests stay aligned
