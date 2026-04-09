# Building graphs

The canvas in context: nodes (here Oscillator → Gain → Output), tabs, and transport. Open the **Catalog** rail mode to add more blocks.

![Simple patch on the canvas with three nodes wired in sequence.](./images/editor-workspace.png)

## Adding nodes

1. Open the **Catalog** from the activity rail.  
2. Browse by category or **search** (for example “Oscillator”, “Delay”).  
3. **Drag** the node onto the canvas, or use the in-canvas placement flow / connection assist so the new node appears where you are working.  

Templates from **Explorer** can load a **full starter graph** in one step.

## Handles and cables

- Nodes expose **inputs** and **outputs** on the card edge as **handles**.  
- **Drag** from a handle to another compatible handle to create a **cable**.  
- While dragging, the editor **highlights valid targets** so you can see what connects.  
- **Connection assist** can suggest compatible nodes when you start from a handle.  

## Selection and focus

- Select **one main node** at a time for a clear link to the **inspector**.  
- Click empty canvas to clear node selection and edit **graph defaults** in the inspector.  

## Parameters on the node vs inspector

- Simple controls may appear on the node card.  
- When an input is **already connected**, the node often shows a **live read-only value** instead of the knob or field, so you see what the cable is driving.  
- Deeper settings are in the right-hand **Inspect** tab for the selected node.

## Transport and playback

- Use the **Transport** node (**Sources**) for tempo and clock. **Only one Transport per graph** is allowed; the editor blocks duplicates.  
- Sequencers such as **Step Sequencer** and **Piano Roll** can **listen to Transport** so patterns stay in sync.  
- Start or stop from the transport controls in the canvas area as you work.

## Hearing the result

- Route audible audio into the **Output** node (**Routing**). **Only one Output per graph** is allowed.  
- Build chains: sources → effects → mixer or aux paths → **Output**.

## MIDI clock sync

- The **Sync** node (**MIDI**) outputs timing aligned with MIDI clock rules. **Only one Sync node per graph.**

## Arranging the view

Use viewport controls and the minimap to pan and zoom. The command palette (**Cmd/Ctrl+K**) includes actions such as **auto arrange** when the graph gets crowded.

---

[← User guide](./README.md) · [Audio library →](./audio-library.md)
