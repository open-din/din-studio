# Data flow (editor)

## Purpose

Describe how patch state moves through the DIN Studio editor shell for agents debugging store vs codegen vs runtime.

## Pipeline

1. **Zustand store (`ui/editor/store.ts`)** holds graphs, selection, and project-aware asset metadata.
2. **Node catalog (`ui/editor/nodeCatalog.ts`)** defines palette entries, default handles, and agent-facing markdown; must match codegen tests.
3. **Code generator (`ui/editor/CodeGenerator.tsx`, `generateCode`)** reads nodes/edges and emits `@open-din/react` JSX.
4. **Audio engine stub / real engine (`ui/editor/AudioEngine*.ts`)** connects preview playback to the active graph where applicable.
5. **AI tools (`ui/ai/tools.ts`, `ui/ai/systemPrompt.ts`)** consume serialized snapshots from the store—keep catalog text synchronized.

## Persistence

Project assets and patch sources bridge through `project/*` types and `ui/editor/audioLibrary.ts`; patch JSON follows the shared schema validated in `react-din` / `din-core`.

## See also

- [CrossRepoDependencies.md](./CrossRepoDependencies.md)
