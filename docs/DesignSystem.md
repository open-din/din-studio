# Design System

## Purpose

Capture the layout, motion, spacing, and interaction rules shared by DIN Studio shell surfaces and DIN Editor nodes.

## Responsibilities

- Use a `4 px` spacing grid and keep node internals aligned to the same density vocabulary as shell panels.
- Keep node radius, elevation, typography, and control styling consistent across source, effect, routing, math, and MIDI families.
- Treat node chrome, socket rows, badges, and control rows as reusable primitives rather than per-node one-offs.
- Prefer readable, interaction-first canvas surfaces over decorative chrome.

## Node Anatomy Rules

- Every node uses one canonical socket anatomy:
  - outputs render first, at the top of the node, on the right border;
  - inputs render last, at the bottom of the node, on the left border.
- No node may place sockets on the top or bottom border.
- Every exposed socket gets its own row.
- Output rows are single-line rows with the label aligned horizontally with the socket.
- Input rows use a two-level layout:
  - line 1 = label aligned horizontally with the socket;
  - line 2 = inline control or live read-only value.
- Sockets must visibly straddle the node border and keep a larger hit area than the visible pin.
- If an input handle is connected, the editable control must disappear and only the live value remains visible.
- Nodes must not include prose helper blocks, empty-state paragraphs, or decorative explanatory text inside the card body.
- Short labels, badges, and compact status chips are allowed.

## Instrument Editing Rules

- `StepSequencer` and `PianoRoll` are editing widgets first, not decorative previews.
- `StepSequencer` requirements:
  - step columns stay wide enough for mouse editing;
  - pad hit area is at least `28x28`;
  - node width scales with step count and should remain comfortable at `16` and `32` steps before horizontal scrolling is needed.
- `PianoRoll` requirements:
  - note cells stay at least `20 px` wide and `16 px` tall, with larger values preferred when space allows;
  - piano key rows match the note-cell height;
  - node width scales with step count and node height scales with octave count;
  - scrolling is a fallback after the widget reaches a practical editing size.
- Active playback columns on both sequencer widgets must show a luminous vertical state, not just a small local highlight on the active cell.
- Motion for these active states must stay short, interruptible, and honor `prefers-reduced-motion`.

## Integration Notes

- The shell, launcher, and editor nodes share one spacing and elevation vocabulary.
- Typography should distinguish technical labels from workspace labels without adding visual noise.
- Focus, selected, hover, disabled, connected, and live states should follow one shared state vocabulary across shell controls and node internals.
- Node widgets may keep domain-specific behavior such as MIDI mapping, asset selection, meters, or transport controls, but they still obey the shared node anatomy rules above.

## Failure Modes

- Ad hoc socket placement creates inconsistent graph ergonomics and makes connection targets harder to hit.
- Leaving controls visible while a handle is connected creates conflicting input authority.
- Helper paragraphs inside nodes dilute scanability and waste vertical space.
- Sequencer widgets that do not scale with content become tedious to edit with a mouse.
- Highlighting only the active pad instead of the full active column weakens playback legibility.

## Example

- Spacing scale: `4 / 8 / 12 / 16 / 20 / 24 / 32`.
- Radius scale: `10 / 14 / 18`.
- Typography scale: `11 / 12 / 13 / 14 / 16 / 20 / 24`.
- Node families: `source / effect / routing / math / MIDI`.
- Socket rule: `source => top-right`, `target => bottom-left`.

## Test Coverage

- No node handle renders with `Position.Top` or `Position.Bottom`.
- Source handles resolve to the right border and target handles resolve to the left border.
- Connected input handles replace editable controls with read-only live values.
- Legacy prose helper blocks do not reappear inside nodes.
- `StepSequencer` and `PianoRoll` preserve practical editing dimensions and expose an active luminous column state.
