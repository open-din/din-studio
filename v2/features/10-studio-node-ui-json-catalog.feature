@critical-path
Feature: Studio node UI JSON catalog (types, loader, React Flow, migration)
  Implement the Studio-only node catalog JSON contract per din-studio/v2/specs/09-ui-components.md §10.
  Catalog JSON is the UI/interface source of truth and MUST remain decoupled from DinDocument interchange.

  Background:
    Given the normative contract is din-studio/v2/specs/09-ui-components.md section 10
    And Studio catalog JSON is not the .din node schema per v2/specs/03-node-model.md section 8
    And slice routing uses project/EDITOR_NODE_SLICES.json
    And documentation for this task lives in docs_v2/10-studio-node-ui-json-catalog.md

  Scenario: Canonical Studio types exist and stay separate from DinDocument types
    Given Studio introduces StudioNodeDefinition and StudioNodePortSchema
    When types are exported from the catalog module
    Then they do not alias or extend DinDocument or AudioNodeData interchange types
    And StudioNodeType allows dsp interface value transport timeline voice asset

  Scenario: Loader normalizes catalog JSON defaults
    Given raw catalog entries may omit optional fields
    When the catalog normalizer runs
    Then label defaults to null and customComponent defaults to null
    And tags default to an empty array
    And inputs and outputs default to empty arrays

  Scenario: Validation accepts minimal non-DSP definition
    Given a minimal node definition with type not dsp and no dsp field
    When validation runs
    Then the definition is accepted

  Scenario: Validation accepts minimal DSP definition
    Given a minimal dsp node definition with non-empty dsp string
    When validation runs
    Then the definition is accepted

  Scenario: Validation rejects invalid dsp rules and duplicate port names
    Given a dsp node without dsp or with empty dsp string
    When validation runs
    Then the definition is rejected
    Given a non-dsp node that includes dsp
    When validation runs
    Then the definition is rejected
    Given duplicate names within inputs or within outputs
    When validation runs
    Then the definition is rejected

  Scenario: React Flow handles map from port names
    Given a validated StudioNodeDefinition
    When the editor builds source and target handles
    Then each target handle id equals an inputs[].name
    And each source handle id equals an outputs[].name

  Scenario: Default title and custom component resolution
    Given label is null
    When the default node title is derived
    Then the title equals humanize(name)
    Given customComponent is null
    When the node shell resolves its renderer
    Then the default shared shell is used
    Given customComponent is a non-empty registry key
    When the node shell resolves its renderer
    Then the key resolves through the existing Studio UI registry

  Scenario: Palette grouping and search use catalog fields
    Given multiple catalog entries with category and subcategory
    When the palette renders groups
    Then nodes appear under category and subcategory
    When palette search runs
    Then matches may include name label description and tags

  Scenario: Inspector instance label does not mutate catalog
    Given a placed node instance with an inspector label override
    When the user edits the instance label
    Then the on-disk or in-memory catalog JSON definition for that node type is unchanged

  Scenario: DSP nodes expose Faust source only through catalog layer
    Given a dsp catalog entry with dsp string
    When Studio UI or codegen-facing selectors read Faust metadata
    Then they use the catalog dsp field
    And DinDocument persistence shape is not implied by this field

  Scenario: Single JSON entry adds a node without touching multiple tables
    Given a new catalog JSON definition file or array entry
    When the catalog is loaded
    Then the node appears in palette and graph with correct handles without separate taxonomy edits

  Scenario: TDD gate
    Given new catalog helpers or exports are introduced
    When the task merges
    Then unit tests cover validation normalization handle ids and title resolution
    And integration or UI tests cover palette grouping search and handle rendering where feasible
    And JSDoc references docs_v2/10-studio-node-ui-json-catalog.md
