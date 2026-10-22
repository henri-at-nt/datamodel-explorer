# Spec Delta

## MODIFIED Requirements

### Requirement: Two-level navigation
The system SHALL show namespaces as a collapsible first level and the titles of their tables as the second level, and SHALL list the collections of an object indented directly beneath that object.

#### Scenario: Initial state
- **WHEN** the app opens
- **THEN** only the first namespace is expanded

#### Scenario: Collapse and expand
- **WHEN** a namespace's caret is clicked
- **THEN** its tables are hidden or shown and the current page does not change

#### Scenario: Collections beneath their parent
- **WHEN** a namespace with an object that has collections is expanded
- **THEN** each collection appears indented beneath its parent object, before the next table
