Feature: Faust code generation and parameter binding
  As a DSP author
  I want the studio to extract the audio subgraph and emit one Faust process
  So that compilation is deterministic and parameters bind to runtime paths

  Background:
    Given subgraph rules are in din-studio/v2/specs/05-faust-codegen.md
    And parameter externalization is in din-studio/v2/specs/06-params-binding.md
    And dsp primitives reference din-studio/v2/specs/08-primitives-catalog.md and din-studio/v2/specs/04-dsp-and-faust.md

  Scenario: Emit a single top-level process
    Given a studio graph with a well-formed dsp subgraph
    When codegen runs
    Then the output contains exactly one top-level process composition
    And node identifiers are mangled safely into Faust identifiers

  Scenario: Primitive kinds expand from the registry
    Given dsp nodes whose kind is listed in the primitives catalog
    When codegen lowers them
    Then expansion uses the shared primitive registry templates
    And imports are deduplicated in the preamble

  Scenario: Externalized params use deterministic argument order
    Given params driven from the graph per binding rules
    When codegen produces the Faust block or process signature
    Then external arguments follow a deterministic order policy
    And the compile manifest lists studio keys to Faust paths
