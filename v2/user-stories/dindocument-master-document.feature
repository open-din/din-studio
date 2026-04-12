Feature: DinDocument v1 as the studio master document
  As a studio author
  I want the editor to load and persist projects as DinDocument v1 JSON
  So that the interchange matches open-din and can be validated by din-core

  Background:
    Given the normative document format is defined by sibling workspace open-din/v2/din-document-core.md
    And the JSON Schema is open-din/v2/schema/din-document.core.schema.json
    And the studio dossier is din-studio/v2/specs/01-overview.md and din-studio/v2/specs/02-din-document.md

  Scenario: Open a valid example document
    Given a UTF-8 DinDocument v1 JSON file from open-din/v2/examples
    When the user opens it in din-studio
    Then the editor loads without structural data loss for fields the studio supports
    And node identifiers remain stable across the session

  Scenario: Reject or surface invalid documents
    Given a JSON file from open-din/v2/examples/invalid
    When the user attempts to open it
    Then the product shows structured diagnostics or refuses load per validation policy
    And no partial corrupt graph is persisted silently

  Scenario: Save round-trip preserves authoritative fields
    Given an in-memory document that conforms to the supported DinDocument subset
    When the user saves to disk
    Then the serialized JSON remains valid UTF-8 DinDocument v1 where declared
    And scenes, routes, and node collections the editor owns round-trip
