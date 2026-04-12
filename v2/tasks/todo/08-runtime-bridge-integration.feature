@parallel-safe
Feature: Runtime bridge integration
  Wire compile triggers, workers, and din-core hooks per din-studio/v2/specs/10-runtime-bridge.md
  and din-core/v2/specs for WASM and session boundaries.

  Background:
    Given deployment shapes are described in din-studio/v2/specs/10-runtime-bridge.md
    And din-core behavior is authoritative in din-core/v2/specs (validation, runtime transport, wasm)
    And documentation for this task will live in docs_v2/08-runtime-bridge-integration.md
    And this task depends on tasks 01 and 06

  Scenario: Compile action uses non-blocking execution path
    Given a compile is triggered from the UI
    When the graph is large
    Then work is scheduled off the main thread in the configured deployment shape
    And errors return to the UI without freezing

  Scenario: Validation defers to din-core when integrated
    Given din-core WASM or native bindings are available
    When the studio validates a document
    Then results match din-core diagnostics for the same fixture

  Scenario: TDD gate
    Given integration tests mock WASM boundaries where full engine is unavailable
    When the task merges
    Then tests pass and docs_v2 lists thread and message contracts
