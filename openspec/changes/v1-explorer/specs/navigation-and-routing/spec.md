# Spec Delta

## Purpose
Defines how people move around the model and how every view can be bookmarked and shared.

## ADDED Requirements

### Requirement: Two-level navigation
The system SHALL show namespaces as a collapsible first level and the titles of their tables as the second level.

#### Scenario: Initial state
- **WHEN** the app opens
- **THEN** only the first namespace is expanded

#### Scenario: Collapse and expand
- **WHEN** a namespace's caret is clicked
- **THEN** its tables are hidden or shown and the current page does not change

### Requirement: Table titles, not technical names
The system SHALL show a table's label in the navigation, or a readable form of its name when the label equals the name, and SHALL show the technical name on the table page.

#### Scenario: Label equals name
- **WHEN** a table's label is the same as its technical name
- **THEN** the name is shown with spaces and an initial capital

### Requirement: Every view has a URL
The system SHALL give the app, each namespace overview and each table page its own address, and SHALL open the right view when that address is loaded directly or the page is reloaded.

#### Scenario: Direct load
- **WHEN** the address of a table page is opened in a new tab
- **THEN** that table's page is shown with its namespace expanded in the navigation

#### Scenario: Unknown address
- **WHEN** an address names a namespace or table that does not exist
- **THEN** a not-found message with a link back to the start is shown

### Requirement: Links between tables
The system SHALL turn every relation target that is a table into a link, including targets in other namespaces.

#### Scenario: Link to another namespace
- **WHEN** a relation target is a table in another namespace and is clicked
- **THEN** that table's page opens and its namespace is expanded in the navigation
