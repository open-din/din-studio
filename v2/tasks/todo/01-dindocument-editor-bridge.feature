@critical-path
Feature: DinDocument v1 editor bridge
  Implementable slice: align the editor document model and persistence with DinDocument v1
  and open-din/v2 examples. Escalate persisted ID or schema changes to react-din/din-core per AGENTS.md.

  Background:
    Given the normative interchange is open-din/v2 (din-document-core.md, schema/din-document.core.schema.json)
    And the studio spec is din-studio/v2/specs/02-din-document.md
    And documentation for this task will live in docs_v2/01-dindocument-editor-bridge.md

  Scenario: Parse and load minimal valid DinDocument JSON
    Given a UTF-8 JSON text matching open-din/v2/examples/minimal.din.json
    When the editor bridge ingests the document
    Then parsing succeeds
    And the in-memory model exposes scenes and node collections supported by the studio

  Scenario: Round-trip save preserves supported fields
    Given a document loaded from a valid example
    When the bridge serializes the document after a no-op edit session
    Then required DinDocument v1 root fields remain valid
    And node ids in edited scopes are unchanged

  Scenario: Invalid example surfaces diagnostics
    Given JSON from open-din/v2/examples/invalid for a rule the bridge enforces
    When the bridge validates or parses
    Then the product exposes structured errors or rejection
    And tests assert stable error codes or messages for CI

  Scenario: TDD gate
    Given a failing test exists for each new public bridge API
    When implementation lands
    Then tests pass and public APIs have JSDoc linked from docs_v2
