# Spec Delta

## Purpose
Defines how people find a table, field or enum without knowing which namespace it is in.

## ADDED Requirements

### Requirement: Global search
The system SHALL search tables, fields and enums across all namespaces by name, label and, with lower rank, description, and SHALL link each result to the relevant page.

#### Scenario: Match on name
- **WHEN** a term of at least two characters matches a table name
- **THEN** that table is listed first, ahead of fields and enums with the same match quality

#### Scenario: Field result
- **WHEN** a field result is chosen
- **THEN** the page of the table that owns the field opens

#### Scenario: Short query
- **WHEN** fewer than two characters are entered
- **THEN** no results are shown

### Requirement: Case-insensitive
The system SHALL ignore letter case when matching.

#### Scenario: Upper case term
- **WHEN** a term is typed in upper case
- **THEN** it matches the same results as in lower case

### Requirement: Search is reachable by keyboard
The system SHALL let people focus the search box with a shortcut and open a result with the keyboard.

#### Scenario: Shortcut
- **WHEN** the shortcut is pressed outside a text field
- **THEN** the search box receives focus
