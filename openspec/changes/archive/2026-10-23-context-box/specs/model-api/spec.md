# Spec Delta

## ADDED Requirements

### Requirement: Contexts of a table
The system SHALL report, for each table, the contexts it is enriched with, and for each context the groups and fields it offers according to the model's shared definitions.

#### Scenario: Tables differ
- **WHEN** one table has a browser context and another does not
- **THEN** only the first lists it

#### Scenario: Composite context
- **WHEN** a context is made of several groups
- **THEN** it is reported with each of its groups and their fields

#### Scenario: Context without a definition
- **WHEN** a table names a context the shared definitions do not define
- **THEN** the context is reported by name with no fields

### Requirement: One context relation per table
The system SHALL report all contexts of a table as a single relation, whose explanation names each context and its fields, and SHALL report no context relation for a table without contexts.

#### Scenario: Table with three contexts
- **WHEN** a table has three contexts
- **THEN** its relations contain exactly one context relation
