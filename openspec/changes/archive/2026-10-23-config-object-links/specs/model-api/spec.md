# Spec Delta

## ADDED Requirements

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
