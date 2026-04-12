@parallel-safe
Feature: Graph editor ports, edges, and connection policy
  Align React Flow handles and transactional edits with din-studio/v2/specs/07-graph-editor.md.

  Background:
    Given handle ids MUST equal port ids from the document
    And connection rules follow din-studio/v2/specs/07-graph-editor.md sections 3–4
    And documentation for this task will live in docs_v2/03-graph-editor-ports-edges.md
    And this task depends on task 02 stable port types

  Scenario: Valid audio edge persists on document ids
    Given two dsp nodes with compatible audio ports
    When the user completes a connection in the canvas
    Then the store records an edge with source and target port ids from the document
    And undo removes the same edge by document identity

  Scenario: Type mismatch prevents edge creation
    Given an audio output and an incompatible input
    When a connection is attempted
    Then no edge is committed
    And the UI signals the rejection

  Scenario: Fan-in policy enforced
    Given an input port that does not allow fan-in
    When a second edge targets the same input
    Then the editor rejects or prompts per routing policy

  Scenario: TDD gate
    Given store and selector unit tests cover edge validation
    When the task merges
    Then tests pass and public graph helpers are documented in docs_v2
