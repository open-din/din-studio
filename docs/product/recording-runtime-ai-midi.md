# Recording, runtime, AI, and MIDI

## Bottom drawer

Below the canvas, the **bottom drawer** groups live tools without crowding the graph.

Typical tabs:

| Tab | Purpose |
|-----|---------|
| **Runtime** | Live signals such as MIDI or transport-related status. |
| **Diagnostics** | Warnings and graph health information without blocking modals. |
| **Recording** | Capture **master output** while transport runs: waveform feedback, preview, trim, loop, export, and optional import into the **Audio Library** as a sample or impulse. |
| **AI Agent** | Chat and agent actions for the project; settings and history persist for the workspace. |

You can **resize** the drawer; it should remember a useful height between sessions.

## MIDI device panel

The **MIDI device** surface (see product scenario **F15** in the repo) lets you connect **hardware MIDI** to the graph’s MIDI nodes. Pair it with the **MIDI** nodes guide for inputs, outputs, clock, and file playback.

## MCP (Model Context Protocol)

If you use external tools that speak **MCP**, DIN Studio can expose an MCP server target for automation and integrations. Day-to-day patching does not require MCP; details for operators live in [MCP](../MCP.md).

---

[← User guide](./README.md) · [Sources nodes →](./nodes/sources.md)
