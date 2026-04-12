@critical-path
Feature: Node catalog taxonomy (type, kind, ports, params)
  Refactor ui/editor/nodeCatalog and related slices so catalog metadata matches
  din-studio/v2/specs/03-node-model.md and primitive naming in 08-primitives-catalog.md.

  Background:
    Given v2 node model rules are in din-studio/v2/specs/03-node-model.md
    And slice routing uses project/EDITOR_NODE_SLICES.json
    And documentation for this task will live in docs_v2/02-node-catalog-taxonomy.md

  Scenario: Every catalog entry exposes structural type and domain kind
    Given the built-in catalog is enumerated in tests
    When a test loads catalog definitions
    Then each entry has a non-empty type and kind string compatible with v2 vocabulary
    And ports and params use stable string ids

  Scenario: Ports are not conflated with params
    Given a dsp catalog entry with both ports and params
    When the editor derives inspector and handle metadata
    Then connection targets use port ids
    And inspector fields use param ids without collision

  Scenario: Coverage manifest stays aligned
    Given project/COVERAGE_MANIFEST.json lists editor nodes
    When catalog entries change
    Then coverage rows and tests are updated in the same change set

  Scenario: TDD gate
    Given new catalog types or helpers are exported
    When the task merges
    Then unit tests cover normalization and JSDoc references docs_v2
