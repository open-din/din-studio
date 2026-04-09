# MIDI nodes

MIDI nodes move **note**, **controller**, **clock**, and **file** data between the **hardware/device layer** and your patch. They live under **MIDI** in the **Catalog**.

## Piano / keys in (Midi Note)

Receives **note on/off** and related data from a MIDI input path (device selection happens in the MIDI surface / runtime). Outputs note, gate, and velocity-style signals for **Voice**, **Sampler**, or custom logic.

## Controllers / CC in (Midi CC)

Receives **MIDI CC** (continuous controllers) as normalized or scaled values. Use for knobs, faders, pedals, and modulation wheels driving any target handle.

## Note Out

Sends **MIDI notes** out to a chosen destination—play external gear or software from gates and pitches in your graph.

## CC Out

Sends **MIDI CC** messages outward so you can automate hardware or other apps from control voltages in the patch.

## Sync

**MIDI clock / sync** output aligned with transport rules. **Singleton**—one per graph. Use when slaving other equipment or aligning to MIDI timecode-style behavior.

## MIDI Player

Plays a **MIDI file** from the project or disk (where supported), turning file events into the same kinds of signals as live MIDI inputs for the rest of the graph.

---

[← Sources nodes](./sources.md) · [Effects nodes →](./effects.md)
