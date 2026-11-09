# Spec Delta

## ADDED Requirements

### Requirement: The start command stops everything it started
The system SHALL, when the start command receives an interrupt, terminate, hangup or quit signal, or when the process that started it is gone, stop the server and everything it started and free its port.

#### Scenario: Hangup
- **WHEN** the start command receives a hangup signal
- **THEN** no process it started is still running a few seconds later, and its port is free

#### Scenario: Parent killed
- **WHEN** the process that started the start command is killed
- **THEN** no process it started is still running a few seconds later
