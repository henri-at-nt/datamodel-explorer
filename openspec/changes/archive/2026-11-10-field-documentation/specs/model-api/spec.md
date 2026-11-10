## ADDED Requirements

### Requirement: Field documentation in the API
The system SHALL return, for every field and metric, the details, the requirements and the deprecation information (reason, and since-version when present) from the model's documentation block, and SHALL leave them out when the model has none.

#### Scenario: Field with full documentation
- **WHEN** a field has details, requirements and deprecation information in the model
- **THEN** the table response carries all three for that field

#### Scenario: Field without
- **WHEN** a field has none of them
- **THEN** the response carries none of them for that field
