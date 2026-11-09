# server-lifecycle Specification

## Purpose
Defines how the server and the development command stop, so nothing keeps running or blocks a shutdown.

## Requirements

### Requirement: The server stops on stop signals
The system SHALL close its listener and exit when it receives an interrupt, terminate or hangup signal, and SHALL exit within a few seconds even if connections are still open.

#### Scenario: Terminate with connections open
- **WHEN** the server receives a terminate signal while a browser connection is open
- **THEN** the process exits within a few seconds

### Requirement: The development command stops everything it started
The system SHALL, when the development command receives an interrupt, terminate, hangup or quit signal, stop the API process, the web development server and everything they started, and free their ports.

#### Scenario: Hangup
- **WHEN** the development command receives a hangup signal
- **THEN** no process it started is still running a few seconds later, and its ports are free

#### Scenario: Interrupt
- **WHEN** the development command receives an interrupt signal
- **THEN** no process it started is still running a few seconds later

### Requirement: The development command stops when its parent is gone
The system SHALL stop everything the development command started when the process that started it no longer exists.

#### Scenario: Parent killed
- **WHEN** the process that started the development command is killed
- **THEN** no process the command started is still running a few seconds later

### Requirement: One part failing stops the other
The system SHALL stop the web development server when the API process exits, and the API process when the web development server exits.

#### Scenario: Web server crashes
- **WHEN** the web development server exits
- **THEN** the API process is stopped and the development command exits

### Requirement: The start command stops everything it started
The system SHALL, when the start command receives an interrupt, terminate, hangup or quit signal, or when the process that started it is gone, stop the server and everything it started and free its port.

#### Scenario: Hangup
- **WHEN** the start command receives a hangup signal
- **THEN** no process it started is still running a few seconds later, and its port is free

#### Scenario: Parent killed
- **WHEN** the process that started the start command is killed
- **THEN** no process it started is still running a few seconds later
