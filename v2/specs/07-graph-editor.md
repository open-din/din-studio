# Graph editor (visual surface)

## 1. Technology baseline

The din-studio canvas uses **React** and **@xyflow/react** (React Flow) for node-based editing.

Responsibilities:

- Render heterogeneous `.din` nodes (`type` / `kind`).
- Manage selection, multi-select, snap, zoom/pan.
- Create/edit **edges** between **ports** (handles).
- Support **nested navigation** for `type: graph` groups.

## 2. Handles and ports

Each rendered node exposes **source** and **target** handles mapped 1:1 to logical `inputs[]` / `outputs[]` from `.din`.

| Concept | React Flow |
|---------|------------|
| Output port | `source` handle |
| Input port | `target` handle |
| Port id | `handle id` string |

**Rule:** Handle ids MUST equal port `id` values for stable round-trip.

## 3. Connection rules

The editor SHOULD enforce:

- **Type compatibility** (`audio` → `audio`, `float` → `float`, etc.).
- **Channel compatibility** where declared (mono vs stereo).
- **No fan-in** on ports unless the port semantics explicitly allow it (use a `routing` merge node).

On invalid connect attempts:

- Show inline error or suppress edge creation.
- Optionally offer **connection assist** menu (insert gain/mixer node).

## 4. Groups and subgraphs (`type: graph`)

### 4.1 Visual containment

- Group frames wrap child nodes.
- Double-click or “enter” action focuses nested `graph`.

### 4.2 Interface ports

Groups MAY expose **public ports** (inputs/outputs) mapped to internal nodes via **group edge routing** metadata.

### 4.3 Collapse/expand

Collapsed groups show summarized param controls; expanded shows full child graph.

## 5. Undo/redo and persistence

- All graph mutations MUST go through a **transactional store** (e.g. zustand + patch log).
- Undo stack keys off **node/edge ids**, not React Flow internal ids.

## 6. Code generation triggers

Codegen SHOULD run:

- On explicit user action (“Compile DSP”), and/or
- Debounced auto-compile in dev mode

Never block UI thread during Faust WASM compile; offload to worker (see [10-runtime-bridge.md](./10-runtime-bridge.md)).

## 7. Minimap, search, and navigation

- Minimap shows **type** color coding (see `nodeColorMap` patterns in codebase).
- Search jumps to `nodeId` / `name`.

## 8. Accessibility (target)

- Keyboard navigation between nodes.
- Visible focus rings on handles.

## 9. MCP and AI assist (optional)

The MCP target MAY expose graph edit operations; all mutations MUST still serialize to `.din` rules (see `project/MCP_TOOL_SLICES.json` in repo).
