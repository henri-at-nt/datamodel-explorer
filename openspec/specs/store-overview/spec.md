# store-overview Specification

## Purpose
Defines the per-namespace overview that shows how data reaches ClickHouse: topics, NQL tables and ClickHouse tables.

## Requirements

### Requirement: Store diagram
The system SHALL show, for a namespace, the Kafka topics, NQL tables, objects, config objects and linkages, and the ClickHouse tables they are stored in, with lines for "feeds" and "stored in".

#### Scenario: Namespace with topics and tables
- **WHEN** a namespace overview is opened
- **THEN** every topic, NQL table and ClickHouse table of the store model appears as a box with its connections

#### Scenario: ClickHouse table labels
- **WHEN** a ClickHouse table box is shown
- **THEN** its title names the table, its time resolution and the NQL table it belongs to

### Requirement: Hover details
The system SHALL show a box's columns when it is hovered, each with the column name and its NQL field and protobuf path.

#### Scenario: Hover
- **WHEN** the pointer is over a box
- **THEN** a popup lists that box's columns or table properties and disappears when the pointer leaves

### Requirement: Zoom
The system SHALL let people zoom the diagram with buttons, with Ctrl or Cmd plus scroll, fit it to the width, and reset it.

#### Scenario: Fit to width
- **WHEN** "Fit" is chosen
- **THEN** the diagram is scaled so its full width is visible, without enlarging it beyond its natural size

### Requirement: No invented feeds
The system SHALL draw only the feeds the store model declares.

#### Scenario: Table without a feed
- **WHEN** an NQL table has no declared Kafka topic
- **THEN** the diagram shows it without a "feeds" line and the table page says no feed is declared

### Requirement: Namespaces without storage mappings
The system SHALL say so, rather than show an empty or broken diagram, when a namespace has no storage mappings.

#### Scenario: Empty store model
- **WHEN** a namespace has no store entities
- **THEN** a short message replaces the diagram
