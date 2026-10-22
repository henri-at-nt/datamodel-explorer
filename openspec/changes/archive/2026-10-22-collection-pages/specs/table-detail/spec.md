# Spec Delta

## MODIFIED Requirements

### Requirement: Table header
The system SHALL show the table's title, kind (timeseries, object, config object, linkage or collection), technical name, collection name, key properties and description.

#### Scenario: Missing description
- **WHEN** the model has no description for a table
- **THEN** the page says so instead of leaving a gap

## ADDED Requirements

### Requirement: Collection page
The system SHALL give every collection of an object its own page, named as NQL names it (the object name, a dot and the collection name, for example `device.cpus`), listing the fields of the collection's element type with their JSON paths.

#### Scenario: Fields with JSON paths
- **WHEN** a collection page is opened
- **THEN** each field of the element type is listed with name, label, type, platforms, description and JSON path

#### Scenario: Link to the parent
- **WHEN** a collection page is opened
- **THEN** it says the collection is a JSON array on its parent object and links to the parent's page, in the relationship diagram and in the list

#### Scenario: Parent links to the collection
- **WHEN** the parent object's page is opened
- **THEN** its relationship diagram and relation list link to each collection's page

### Requirement: No storage is invented for collections
The system SHALL say that the store model declares no table, column mapping or Kafka topic for a collection, and SHALL NOT state where its data is stored.

#### Scenario: Storage section
- **WHEN** a collection page is opened
- **THEN** the storage section says the store model declares nothing for this collection and shows no table or column mapping
