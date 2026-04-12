Feature: Studio node model aligned with v2 taxonomy
  As an editor implementer
  I want every studio node to expose type, kind, ports, params, and payloads per v2
  So that graph semantics and Faust lowering stay consistent

  Background:
    Given the node shape is specified in din-studio/v2/specs/03-node-model.md
    And primitive naming follows din-studio/v2/specs/08-primitives-catalog.md
    And ports are distinct from params as normative for din-studio

  Scenario: Catalog entries declare structural type and domain kind
    Given a built-in or extension node in the node catalog
    When the editor registers it for palette and codegen
    Then it declares a structural type and domain kind compatible with v2
    And each audio or control port has a stable port id

  Scenario: Params map to inspector and optional Faust metadata
    Given a dsp node with params in the document
    When the user edits values in the inspector
    Then updates apply to the document model
    And Faust path metadata remains stable when present per din-studio/v2/specs/06-params-binding.md

  Scenario: Nested graph nodes encapsulate subgraphs
    Given a node with type graph and a nested graph payload
    When the author expands or navigates the group
    Then child nodes and edges are editable within scope
    And identifiers remain unique within the nested scope
