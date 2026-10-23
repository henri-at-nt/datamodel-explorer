# Spec Delta

## ADDED Requirements

### Requirement: A namespace is the name declared in its files
The system SHALL identify a namespace by the name declared inside its model files, and SHALL merge the content of every folder that declares the same name into one namespace.

#### Scenario: Namespace in two folders
- **WHEN** two folders declare the same namespace name
- **THEN** the namespace appears once, with the tables, types and enums of both folders

#### Scenario: Description from the primary folder
- **WHEN** only one of the folders gives the namespace a description
- **THEN** the merged namespace has that description

#### Scenario: Links into a merged namespace
- **WHEN** a table links to a table that was defined in the second folder of a merged namespace
- **THEN** the link resolves to that table
