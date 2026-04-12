@critical-path
Feature: Parameter binding, externalization, and compile manifest
  Implement widget mapping and externalized parameters per din-studio/v2/specs/06-params-binding.md
  and manifest expectations in din-studio/v2/specs/10-runtime-bridge.md.

  Background:
    Given param model rules are in din-studio/v2/specs/06-params-binding.md
    And manifest shape is referenced from din-studio/v2/specs/10-runtime-bridge.md
    And codegen from task 06 produces Faust with optional lifted arguments
    And documentation for this task will live in docs_v2/07-params-binding-manifest.md

  Scenario: Unconnected params keep local widgets
    Given a param with no modulation binding
    When codegen completes
    Then the Faust retains a widget form or equivalent per mapping table
    And the manifest lists the Faust path for host control

  Scenario: Graph-driven params are externalized
    Given a binding from a modulation source to a param
    When codegen runs
    Then the param is lifted per externalization rules
    And argument order follows the deterministic policy tested in unit tests

  Scenario: Manifest maps studio keys to engine paths
    Given a successful compile
    When the host reads manifest.json or equivalent structure
    Then entries include nodeId and paramId to Faust path mapping

  Scenario: TDD gate
    Given tests cover binding parsing and manifest emission
    When the task merges
    Then tests pass and docs_v2 describes manifest fields
