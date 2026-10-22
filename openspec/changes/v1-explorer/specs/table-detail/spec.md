# Spec Delta

## Purpose
Defines the page for one table: what it contains, how it relates to others and how it is stored.

## ADDED Requirements

### Requirement: Table header
The system SHALL show the table's title, kind (timeseries, object, config object or linkage), technical name, collection name, key properties and description.

#### Scenario: Missing description
- **WHEN** the model has no description for a table
- **THEN** the page says so instead of leaving a gap

### Requirement: Field list
The system SHALL list every field and metric with name, label, type, platforms and description, marking metrics.

#### Scenario: Metric
- **WHEN** a table has metrics
- **THEN** they appear among the fields with a "metric" marker

### Requirement: Summary cards filter the page
The system SHALL show counts for fields, metrics, structured fields, relations and ClickHouse tables, and SHALL show only the matching section when a count is chosen.

#### Scenario: Filter on
- **WHEN** a count is chosen
- **THEN** only that category is shown, the count is marked active and a banner names the filter

#### Scenario: Filter off
- **WHEN** the active count or the banner's "Clear filter" is chosen
- **THEN** everything is shown again

#### Scenario: Filter does not follow to another table
- **WHEN** another table is opened
- **THEN** no filter is active

### Requirement: Structured fields and collections
The system SHALL list structured fields and JSON-array collections with the fields and metrics of their type, including metrics stored in the type, and the JSON path where the model defines one.

#### Scenario: Type with only metrics
- **WHEN** a structured type has metrics but no fields
- **THEN** the metrics are listed and the count is not zero

### Requirement: Enums
The system SHALL show the values of the enumerations a table uses, including enumerations defined in another namespace.

#### Scenario: Shared enumeration
- **WHEN** a field uses an enumeration defined in another namespace
- **THEN** its values are listed

### Requirement: Storage
The system SHALL show the Kafka topic, the ClickHouse tables (time resolution, storage type, retention) and the column mappings of a table, and SHALL say when the model declares no topic.

#### Scenario: Column without a storage name
- **WHEN** a column mapping has no storage name
- **THEN** the NQL field name is shown as the column name
