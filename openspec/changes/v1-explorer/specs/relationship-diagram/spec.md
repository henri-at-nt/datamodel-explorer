# Spec Delta

## Purpose
Defines the small diagram on a table page that shows what the table relates to.

## ADDED Requirements

### Requirement: Relationship diagram
The system SHALL draw the table in the centre and every related table, structured type, context and external object around it, with a labelled line for each relation, laid out top to bottom.

#### Scenario: Table with relations
- **WHEN** a table page is opened
- **THEN** the diagram shows each relation, with arrows pointing from the referencing table to the referenced one

#### Scenario: Table without relations
- **WHEN** a table has no relations
- **THEN** the page says so and draws no diagram

### Requirement: List alternative
The system SHALL offer the same relations as a collapsed list with a one-line explanation of each.

#### Scenario: List
- **WHEN** the list is expanded
- **THEN** each relation shows its direction, target and explanation

### Requirement: Failure is visible
The system SHALL keep the page usable and say that the diagram failed when it cannot be drawn.

#### Scenario: Diagram engine unavailable
- **WHEN** the diagram cannot be rendered
- **THEN** an error message appears in its place and the list remains available
