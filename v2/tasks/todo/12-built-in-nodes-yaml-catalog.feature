@parallel-safe
Feature: Built-in nodes as folder-based YAML + palette accordions
  Split the Studio built-in catalog from a single large JSON array into per-node YAML files
  under ui/editor/built-in-nodes/, derive category and subcategory from folder structure,
  keep optional studio-node-catalog.json merge by name, and present the palette with
  first-level accordions and second-level separators.

  Background:
    Given the normative UI contract is din-studio/v2/specs/09-ui-components.md sections 10 and 10.10
    And documentation lives in docs_v2/10-studio-node-ui-json-catalog.md

  Scenario: YAML files load with path-derived taxonomy
    Given built-in node files live under ui/editor/built-in-nodes/<category>/<subcategory>/
    When the catalog loader runs
    Then category and subcategory are assigned from folder slugs with documented label rules
    And inline category or subcategory in a file may not override the path

  Scenario: Merge order preserves override semantics
    Given legacy bootstrap definitions exist
    When built-in YAML rows are merged by name
    Then optional studio-node-catalog.json entries replace prior rows for the same name when valid

  Scenario: Palette groups categories in accordions
    When the node palette renders
    Then each top-level category appears in a collapsible section
    And subcategory groups inside a category are separated visually

  Scenario: Tests and CI
    When npm run lint typecheck test run
    Then studio-node-catalog unit tests cover slug helpers and YAML-backed rows
