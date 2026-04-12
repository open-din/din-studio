Feature: Runtime bridge, compile lifecycle, and MCP tooling
  As a host integrator
  I want compilation and validation off the UI thread with stable contracts
  So that the studio integrates din-core and automation without blocking interaction

  Background:
    Given the runtime bridge is specified in din-studio/v2/specs/10-runtime-bridge.md
    And din-core v2 specs define validation, session, and WASM boundaries under din-core/v2/specs
    And MCP graph assist must serialize to DinDocument rules per din-studio/v2/specs/07-graph-editor.md

  Scenario: Codegen does not block the main thread in production mode
    Given a large graph and a compile action
    When the user triggers compile
    Then heavy work runs off the main thread per deployment shape policy
    And the UI remains responsive or shows explicit progress

  Scenario: Parameter mapping uses the compile manifest
    Given a successful compile producing manifest metadata
    When the host sets a parameter by studio nodeId and paramId
    Then the runtime resolves the Faust path from the manifest

  Scenario: MCP codegen tool matches studio generator output
    Given the MCP target exposes code generation
    When a client requests generated output for the current graph
    Then the result matches the same contract as the in-app generator
    And emitted React or glue references remain consistent with tests
