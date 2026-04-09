# Routing nodes

Routing nodes **sum, split, send, and return** audio so large patches stay organized. They are under **Routing** in the **Catalog**.

## Mixer

**Multi-channel summing** with per-channel level (and pan where exposed). Use to combine voices or stems before effects or master bus.

## Aux Send

**Tap** signal to a **bus** (for example a shared reverb) while keeping a dry path. Typical studio send/return pattern: many tracks → aux sends → one reverb → aux return → mixer.

## Aux Return

**Receives** the processed bus from sends—place the shared **reverb** or **delay** between **Aux Send** and **Aux Return**, or merge returns in the mixer.

## Matrix Mixer

**Flexible cross-route**: multiple inputs to multiple outputs with a grid of levels. Use for feedback patches, spatial matrices, or complex sidechain layouts.

## Output

**Master bus**—connect your final stereo mix here so you hear it and so **recording** can tap the graph output. **Singleton**: one **Output** node per graph.

---

[← Effects nodes](./effects.md) · [Math nodes →](./math.md)
