# Spec Delta

## ADDED Requirements

### Requirement: Collections are tables of their namespace
The system SHALL return each collection of an object as a table of its namespace, of kind collection, that names its parent table, so clients can list and open it like any other table.

#### Scenario: Namespace detail
- **WHEN** a namespace whose object has collections is requested
- **THEN** each collection is among the tables, with the fields of its element type and the key of its parent

#### Scenario: Namespace list
- **WHEN** the namespace list is requested
- **THEN** each collection is listed with its parent's key, directly after the parent
