# Spec Delta

## ADDED Requirements

### Requirement: Tables from other namespaces name their namespace
The system SHALL label the box of a related table that is in another namespace with its title followed by the namespace in brackets, and SHALL label tables in the table's own namespace with the title alone.

#### Scenario: Same title in two namespaces
- **WHEN** a table is related to tables with the same title in two other namespaces
- **THEN** the two boxes show different labels, each with its own namespace

#### Scenario: Table in the same namespace
- **WHEN** a related table is in the same namespace
- **THEN** its box shows only its title
