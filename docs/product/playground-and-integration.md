# Playground & integration

Cross-cutting rules for every editor node and scenarios that exercise the graph as a whole.

## Feature scenarios

| Area | Feature ID | Spec |
|------|------------|------|
| Node registration, layout, and invariants | F02 | [`02_playground_nodes.feature.md`](../../project/features/02_playground_nodes.feature.md) |
| Integrated audio graph behavior | F03 | [`03_playground_integration.feature.md`](../../project/features/03_playground_integration.feature.md) |

F02 defines review invariants (socket placement, connected-handle behavior, sequencer usability). F03 describes multi-node scenarios (voice synth paths, routing, etc.).

## Contributor documentation

- [Node reference by palette category](./nodes/index.md)
- [Editor shell](../EditorShell.md) — where the canvas lives in the product
- [Data flow](../DataFlow.md) — how graph state reaches codegen

## Related

- [Assets & library](./assets-and-library.md) — samples and patches used by nodes
- [Inspector & code generation](./inspector-and-codegen.md)

---

[← Product home](./README.md)
