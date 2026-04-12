@parallel-safe
Feature: MCP and bridge codegen contract
  Align bridge/protocol.ts codegen requests and MCP tools with the v2 generator output.

  Background:
    Given MCP tools are described in project/MCP_TOOL_SLICES.json
    And graph assist must respect din-studio/v2/specs/07-graph-editor.md
    And the generator contract is defined in task 06
    And documentation for this task will live in docs_v2/09-mcp-codegen-contract.md
    And this task depends on task 06

  Scenario: editor_generate_code matches in-app codegen
    Given the same graph state in the editor
    When MCP invokes code generation and the in-app generator runs
    Then structured outputs are equivalent under tests for supported node subsets

  Scenario: Protocol envelope codegen.generate stays versioned
    Given bridge clients send codegen.generate
    When the server handles the request
    Then responses include enough metadata for clients to consume manifests when present

  Scenario: TDD gate
    Given targets/mcp/tests cover the contract
    When the task merges
    Then npm test passes for MCP targets and docs_v2 references tool ids
