# Skill: agent-prompt-catalog-sync

## Triggers

- Edits to `ui/ai/systemPrompt.ts`, `ui/ai/tools.ts`, or `ui/editor/nodeCatalog.ts`.
- New AI capabilities, tools, or node types that the agent must know about.

## Workflow

1. Read `ui/ai/systemPrompt.ts` and `ui/ai/tools.ts` for current contract boundaries.
2. Update `ui/editor/nodeCatalog.ts` so `buildAgentNodeCatalogMarkdown` and related exports match the live editor.
3. Align prompt text and tool schemas: any node or parameter the agent can mutate must be described consistently across all three files.
4. Update tests: `tests/unit/agent-api.spec.ts`, `tests/unit/agent-settings.spec.ts`, or `tests/unit/agent-chat-storage.spec.ts` as appropriate; extend `tests/e2e/f13-agent-panel.spec.ts` when UI behavior changes.
5. If coverage rows change, update `project/SURFACE_MANIFEST.json` for `surface:AgentPanel`.

## Checks

- `npm run test` (including unit specs above)
- `npm run validate:manifests`

## Expected outputs

- Agent prompt, tools, and catalog stay in sync; no stale node names or handles in the system prompt.
