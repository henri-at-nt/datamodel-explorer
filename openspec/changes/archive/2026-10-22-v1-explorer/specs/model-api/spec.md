# Spec Delta

## Purpose
Defines the read-only HTTP interface through which the web app, and later other clients, read the model.

## ADDED Requirements

### Requirement: Namespace list
The system SHALL list every namespace with its tables (key, name, label, kind) and the size of its store overview.

#### Scenario: Listing
- **WHEN** the namespace list is requested
- **THEN** all namespaces are returned in alphabetical order

### Requirement: Namespace detail
The system SHALL return, for one namespace, its tables with fields, structured fields, relations and storage mappings, the structured types and enums they use, and the store overview graph.

#### Scenario: Known namespace
- **WHEN** a known namespace is requested
- **THEN** every table of the namespace is returned, including config objects and linkages

#### Scenario: Unknown namespace
- **WHEN** an unknown namespace is requested
- **THEN** the response is a 404 with a message naming the namespace

### Requirement: Cross-namespace targets are resolved
The system SHALL express a relation to a table in another namespace as a target that names both the namespace and the table.

#### Scenario: Object link into another namespace
- **WHEN** a table links to an object owned by another namespace
- **THEN** the relation's target identifies that object's table in that namespace

### Requirement: Only declared relationships are reported
The system SHALL report storage feeds only where the store model declares them, and SHALL NOT infer missing ones.

#### Scenario: Table without a declared feed
- **WHEN** a table has no Kafka topic in the store model
- **THEN** its storage information has no topic

### Requirement: Health and reload
The system SHALL report whether it is healthy, with the model's content hash, build time and counts, and SHALL offer an explicit reload.

#### Scenario: Health
- **WHEN** health is requested
- **THEN** the namespace and table counts and the content hash are returned

### Requirement: Unknown API paths
The system SHALL answer unknown paths under the API prefix with a 404 and never with the web app.

#### Scenario: Typo in an API path
- **WHEN** a path under the API prefix matches no endpoint
- **THEN** the response is a 404 in JSON
