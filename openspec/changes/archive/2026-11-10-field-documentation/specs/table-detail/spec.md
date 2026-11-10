## ADDED Requirements

### Requirement: Field documentation
The system SHALL show, for every field and metric, the details text, the requirements text and the deprecation information when the model has them, in the table's field list and in the field lists of structured types and collections.

#### Scenario: Details and requirements
- **WHEN** a field has a details or requirements text
- **THEN** the field row has an expandable section that shows them

#### Scenario: Deprecated field
- **WHEN** a field is deprecated in the model
- **THEN** the row shows a "Deprecated" marker with the reason, and the version it applies from when the model gives one

#### Scenario: Nothing extra
- **WHEN** a field has none of them
- **THEN** the row shows no marker and no expandable section
