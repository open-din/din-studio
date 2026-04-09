# AGENTS — din-studio (HOT + HOOKS)

## CORE RULE
Load MINIMUM context. Use hooks. Do NOT load AGENTS.deep.md unless required.

---

## 1. ROUTING (FIRST DECISION)

Map task → type:

- "node" → editor node
- "UI / panel / flow / asset / launcher" → surface
- "MCP / bridge / tool" → MCP
- "agent / prompt / tools" → AI system

If unclear → choose smallest scope

---

## 2. HOOKS (MANDATORY)

### HOOK: NODE_CHANGE
IF task mentions node / handle / editor:

LOAD ONLY:
- ui/editor/nodeCatalog.ts
- project/COVERAGE_MANIFEST.json

REQUIRE:
- project/features/**
- tests + TEST_MATRIX

---

### HOOK: SURFACE_CHANGE
IF task mentions UI / workflow / panel / asset:

LOAD ONLY:
- project/SURFACE_MANIFEST.json

REQUIRE:
- TEST_MATRIX
- ≥1 automated test

---

### HOOK: MCP_CHANGE
IF task mentions MCP / bridge:

LOAD ONLY:
- targets/mcp/**
- targets/mcp/tests/**

TREAT AS:
- release surface

---

### HOOK: AI_SYSTEM
IF task mentions agent / prompt / tools:

LOAD ONLY:
- ui/ai/systemPrompt.ts
- ui/ai/tools.ts
- ui/editor/nodeCatalog.ts

FOLLOW:
- project/skills/agent-prompt-catalog-sync/SKILL.md

---

### HOOK: DOCS
IF missing info:

LOAD (max 2):
1. docs/summaries
2. docs/**
3. docs/generated (last resort)

STOP when sufficient

---

### HOOK: CROSS_REPO
IF mentions:
schema | serialization | runtime

STOP → switch repo:

- react-din (API)
- din-core (runtime)

---

## 3. HARD CONSTRAINTS

### Node change MUST update:
- nodeCatalog.ts
- COVERAGE_MANIFEST.json
- features/**
- tests + TEST_MATRIX

---

### Surface change MUST update:
- SURFACE_MANIFEST.json
- TEST_MATRIX
- ≥1 test

---

### MCP MUST:
- update tests
- remain stable

---

### NEVER:
- modify public API (react-din)
- implement runtime logic (din-core)
- duplicate contract logic

---

## 4. EXECUTION LOOP

1. Detect hook
2. Load ONLY hook files
3. Execute minimal change
4. Validate

---

## 5. CONTEXT LIMITS

- max 1 repo
- max 2 files
- NEVER scan directories
- NEVER bulk-load docs

If enough → STOP

---

## 6. SELF-OPTIMIZATION

Continuously:

- drop irrelevant context
- ignore unrelated features
- reduce reads
- prefer smallest change

If context grows → compress

---

## 7. LOAD DEEP CONTEXT ONLY IF

- ambiguity
- failing validation
- cross-repo uncertainty

→ THEN load AGENTS.deep.md

---

## 8. VALIDATION

Run:

npm run lint  
npm run typecheck  
npm run validate:manifests  
npm run validate:docs  
npm run test  
npm run test:e2e

If e2e skipped → justify