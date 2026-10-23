# Spec Delta

## ADDED Requirements

### Requirement: Contexts are one box on the right
The system SHALL draw all contexts of a table as one box joined to the table by one line, drawn after the other outgoing boxes so that it sits at the right of them, listing each of the table's contexts and the fields that context offers.

#### Scenario: Several contexts
- **WHEN** a table has several contexts
- **THEN** the diagram shows one context box that names each context with its fields, and one line to it

#### Scenario: Composite context
- **WHEN** a context is made of several groups
- **THEN** the box names the context and lists each group with its fields

#### Scenario: Contexts differ per table
- **WHEN** two tables have different contexts
- **THEN** their context boxes list different contexts

#### Scenario: No contexts
- **WHEN** a table has no contexts
- **THEN** no context box is drawn
