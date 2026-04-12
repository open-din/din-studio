Feature: Visual graph editor with stable port handles
  As a graph author
  I want to connect nodes by dragging between port handles
  So that the canvas round-trips to DinDocument edges without ambiguous wiring

  Background:
    Given the editor behavior is specified in din-studio/v2/specs/07-graph-editor.md
    And React Flow maps outputs to source handles and inputs to target handles
    And handle ids MUST equal logical port ids from the document

  Scenario: Create a valid edge between compatible ports
    Given two nodes with compatible port types
    When the user connects an output handle to an input handle
    Then the document stores an edge referencing those port ids
    And the edge appears in the canvas

  Scenario: Block invalid connections
    Given two ports with incompatible types or illegal fan-in policy
    When the user attempts a connection
    Then the editor rejects or suppresses the edge with clear feedback

  Scenario: Undo and redo use document ids
    Given the user performs graph mutations
    When they undo or redo
    Then node and edge identities follow the transactional store keyed on document ids
    And React Flow internal ids do not replace authoritative ids
