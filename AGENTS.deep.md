# AGENTS — din-studio (DEEP CONTEXT)

## PURPOSE
Loaded ONLY when HOT context is insufficient.

---

## 1. DOCUMENTATION FLOW (STRICT)

1. docs/README.md
2. ../docs/summaries/din-studio-api.md
3. docs/generated (max 2 files)
4. source (last resort)

---

## 2. DOCUMENTATION RULES

- Use docs/** before source
- JSDoc required for public ui/**
- After API change:
  → npm run docs:generate

- If surface changes:
  → update workspace summaries

---

## 3. NODE COVERAGE (STRICT)

project/COVERAGE_MANIFEST.json must align:

- source
- docs
- tests
- scenarios

All required

---

## 4. SURFACE COVERAGE

project/SURFACE_MANIFEST.json must align:

- workflows
- docs
- test coverage

---

## 5. AI SYSTEM CONSISTENCY

Keep aligned:

- ui/ai/systemPrompt.ts
- ui/ai/tools.ts
- ui/editor/nodeCatalog.ts

Follow:
project/skills/agent-prompt-catalog-sync/SKILL.md

---

## 6. MCP RULES

targets/mcp/** is release surface:

- must stay tested
- must stay stable

---

## 7. CODE READING POLICY

- docs > summaries > source
- NEVER scan directories
- read only exact modules

---

## 8. CROSS-REPO RULES

If touching:

- schema
- serialization
- runtime

→ coordinate with:

- react-din
- din-core

---

## 9. DOCUMENTATION FRESHNESS

After changes to:

- exports
- TypeDoc entry points

Run:

npm run docs:generate

Then:

- verify docs
- update summaries if needed

---

## 10. FAILURE STRATEGY

If still unclear:

- do NOT expand context blindly
- assume minimal scope
- avoid cross-repo changes
- document assumption

---

## 11. ANTI-BLOAT

IGNORE:

- full architecture
- unrelated modules
- large docs
- unused features