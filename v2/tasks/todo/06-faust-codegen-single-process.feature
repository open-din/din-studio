@critical-path
Feature: Faust codegen v2 — single process and deterministic output
  Refactor monolithic ui/editor/CodeGenerator.tsx into tested modules that emit one Faust process
  per din-studio/v2/specs/05-faust-codegen.md sections 3–8.

  Background:
    Given codegen must emit a single top-level process
    And naming and determinism follow din-studio/v2/specs/05-faust-codegen.md sections 7–8
    And subgraph extraction from task 05 and registry from task 04 feed the pipeline
    And documentation for this task will live in docs_v2/06-faust-codegen-single-process.md

  Scenario: Output contains exactly one process assignment
    Given a valid extracted subgraph
    When codegen runs
    Then the Faust text has exactly one top-level process definition style required by tests
    And serial and parallel wiring patterns match documented lowering rules

  Scenario: Imports are deduplicated
    Given multiple primitives requiring stdfaust.lib
    When codegen emits the preamble
    Then each import appears once in stable order

  Scenario: Deterministic output for identical inputs
    Given the same document and codegen version flags
    When codegen runs twice
    Then the normalized output text is identical in tests

  Scenario: TDD gate
    Given pure functions live in standalone modules with snapshot or string equality tests
    When the task merges
    Then coverage targets codegen helpers and docs_v2 lists module entry points
