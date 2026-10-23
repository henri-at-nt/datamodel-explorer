# relationship-diagram Specification

## Purpose
Defines the small diagram on a table page that shows what the table relates to.

## Requirements

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

### Requirement: Many incoming links are summarised
The system SHALL draw at most twelve incoming relations individually and SHALL replace the rest with one box that says how many more there are, while the relation list shows all of them.

#### Scenario: More than twelve incoming links
- **WHEN** a table has more than twelve incoming relations
- **THEN** the diagram shows twelve, plus one box "and N more", and the list shows every relation

#### Scenario: Twelve or fewer
- **WHEN** a table has twelve or fewer incoming relations
- **THEN** every one is drawn

### Requirement: Tables from other namespaces name their namespace
The system SHALL label the box of a related table that is in another namespace with its title followed by the namespace in brackets, and SHALL label tables in the table's own namespace with the title alone.

#### Scenario: Same title in two namespaces
- **WHEN** a table is related to tables with the same title in two other namespaces
- **THEN** the two boxes show different labels, each with its own namespace

#### Scenario: Table in the same namespace
- **WHEN** a related table is in the same namespace
- **THEN** its box shows only its title
