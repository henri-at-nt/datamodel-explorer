# model-api Specification

## Purpose
Defines the read-only HTTP interface through which the web app, and later other clients, read the model.

## Requirements

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

### Requirement: Collections are tables of their namespace
The system SHALL return each collection of an object as a table of its namespace, of kind collection, that names its parent table, so clients can list and open it like any other table.

#### Scenario: Namespace detail
- **WHEN** a namespace whose object has collections is requested
- **THEN** each collection is among the tables, with the fields of its element type and the key of its parent

#### Scenario: Namespace list
- **WHEN** the namespace list is requested
- **THEN** each collection is listed with its parent's key, directly after the parent

### Requirement: Links to configured objects are reported
The system SHALL report a link from a timeseries or linkage to a configured object (such as a campaign, application or alert monitor) as an object link, in the same way as a link to any other object, including when the object is in another namespace.

#### Scenario: Campaign responses
- **WHEN** a table declares that its rows link to a configured object
- **THEN** its relations include that object, and the object's own table is the relation's target

### Requirement: Links are reported from both ends
The system SHALL report every link that resolves to a table on both tables it connects, including when the two tables are in different namespaces.

#### Scenario: Link into another namespace
- **WHEN** a table links to a table in another namespace
- **THEN** the linked table lists the referencing table as an incoming relation, with the namespace in its name

#### Scenario: Link within a namespace
- **WHEN** a table links to a table in the same namespace
- **THEN** the linked table lists the referencing table as an incoming relation

### Requirement: Parent objects are reported
The system SHALL report the parent of a configured object, where the model names one, as a relation on the child and a matching relation on the parent.

#### Scenario: Child and parent
- **WHEN** a configured object names a parent object
- **THEN** the child lists its parent, and the parent lists the child

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

### Requirement: Namespaces are listed once, with their source folders
The system SHALL list each namespace once, and SHALL report in a namespace's detail the model folders it was built from.

#### Scenario: Merged namespace
- **WHEN** a namespace is built from two folders
- **THEN** the namespace list contains it once and its detail names both folders
