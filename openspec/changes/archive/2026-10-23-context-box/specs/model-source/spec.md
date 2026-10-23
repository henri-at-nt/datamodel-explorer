# Spec Delta

## ADDED Requirements

### Requirement: Shared context definitions are part of the model
The system SHALL read the shared context definitions that sit beside the namespaces' model files, and SHALL treat a change to them like a change to any other model file.

#### Scenario: Definitions changed
- **WHEN** the shared context definitions change and a request arrives after the check interval
- **THEN** the response reflects the new definitions

#### Scenario: Definitions missing
- **WHEN** the shared context definitions are not present
- **THEN** tables still report which contexts they have, without fields
