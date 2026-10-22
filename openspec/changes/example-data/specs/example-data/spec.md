# Spec Delta

## Purpose
Defines how people choose fields of a table and look at example rows, without exposing personal data by accident.

## ADDED Requirements

### Requirement: Field picker per table
The system SHALL offer, on each table page, a dialog in which people choose which of the table's fields to show.

#### Scenario: Default selection
- **WHEN** the dialog opens
- **THEN** the table's default descriptor fields are selected and personal-data fields are not

### Requirement: Example rows
The system SHALL show a limited number of example rows for the chosen fields from the configured back-end.

#### Scenario: Back-end not configured
- **WHEN** no back-end is configured
- **THEN** the dialog says example data is unavailable and the rest of the page is unaffected

### Requirement: Personal data is masked by default
The system SHALL mask values of fields flagged as personal data until the person explicitly reveals them.

#### Scenario: Flagged field selected
- **WHEN** a personal-data field is selected and rows are shown
- **THEN** its values are masked until a reveal control is used

### Requirement: Credentials stay on the server
The system SHALL keep back-end credentials out of anything sent to the browser.

#### Scenario: Inspecting traffic
- **WHEN** the browser's requests and responses are inspected
- **THEN** no token or secret appears in them
