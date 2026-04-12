@parallel-safe
Feature: Primitives and DSP registry
  Single registry mapping dsp kind values to Faust template metadata per
  din-studio/v2/specs/08-primitives-catalog.md and dsp rules in din-studio/v2/specs/04-dsp-and-faust.md.

  Background:
    Given primitive kinds are normative in din-studio/v2/specs/08-primitives-catalog.md
    And custom inline Faust remains supported via engine.source per din-studio/v2/specs/04-dsp-and-faust.md
    And documentation for this task will live in docs_v2/04-primitives-dsp-registry.md
    And this task depends on task 02 catalog taxonomy

  Scenario: Registry lists all first-party kinds required for MVP codegen
    Given the primitives table in v2 specs
    When tests enumerate the registry
    Then each listed kind has a definition object with imports and expansion hook
    And unknown kinds fall through to explicit engine.source or a clear error

  Scenario: Registry is the single source for palette and codegen hints
    Given a kind registered for oscillators
    When the palette and codegen both query the registry
    Then they read the same metadata without duplicated tables

  Scenario: TDD gate
    Given unit tests cover each registry entry’s imports list
    When the task merges
    Then tests pass and registry public API is documented in docs_v2
