# Spec Delta

## ADDED Requirements

### Requirement: Namespaces are listed once, with their source folders
The system SHALL list each namespace once, and SHALL report in a namespace's detail the model folders it was built from.

#### Scenario: Merged namespace
- **WHEN** a namespace is built from two folders
- **THEN** the namespace list contains it once and its detail names both folders
