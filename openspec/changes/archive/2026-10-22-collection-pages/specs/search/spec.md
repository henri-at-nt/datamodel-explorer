# Spec Delta

## ADDED Requirements

### Requirement: Collections are found by their NQL name
The system SHALL find a collection by its NQL name or by the label of its element type.

#### Scenario: Searching for device.cpus
- **WHEN** the term "device.cpus" is searched
- **THEN** the collection page is the first result
