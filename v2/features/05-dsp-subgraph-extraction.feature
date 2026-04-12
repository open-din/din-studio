@critical-path
Feature: DSP subgraph extraction for Faust lowering
  Implement inclusion and exclusion of nodes per din-studio/v2/specs/05-faust-codegen.md section 2
  including group inlining preparation.

  Background:
    Given extraction rules are in din-studio/v2/specs/05-faust-codegen.md
    And the document bridge from task 01 supplies authoritative graph data
    And documentation for this task will live in docs_v2/05-dsp-subgraph-extraction.md

  Scenario: Dsp nodes are included
    Given a document with type dsp nodes
    When extraction runs
    Then all dsp nodes in scope appear in the extracted subgraph

  Scenario: Non-dsp studio nodes are excluded by default
    Given transport and timeline nodes in the same document
    When extraction runs
    Then they are omitted unless the spec explicitly includes them for control bindings

  Scenario: Nested graph nodes flatten identifiers safely
    Given a type graph group containing dsp children
    When extraction prepares inline lowering
    Then child nodes receive deterministic mangled ids without collisions in tests

  Scenario: TDD gate
    Given golden tests over small synthetic documents and open-din examples
    When the task merges
    Then extraction output is stable and documented in docs_v2
