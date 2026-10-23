# model-source Specification

## Purpose
Defines where the explorer gets the model from and how it stays current without being restarted.

## Requirements

### Requirement: Model files are read from a configurable local folder
The system SHALL read the NQL data model and store model files from a folder set by configuration, and SHALL NOT store copies of them in its own repository.

#### Scenario: Default folder
- **WHEN** no folder is configured
- **THEN** the system uses the data-model-content clone in the surrounding Endpoint studio workspace

#### Scenario: Folder missing
- **WHEN** the configured folder does not contain the model files
- **THEN** the system fails to start and the message names the folder and the setting that controls it

### Requirement: The model is built on request and cached
The system SHALL build the model from the files on first use and serve later requests from memory.

#### Scenario: First request
- **WHEN** the first request arrives
- **THEN** the model is built from all namespaces before the response is sent

### Requirement: Changed files refresh the model
The system SHALL detect changes to the model files by their content, checking at most once per minute, and SHALL rebuild the model only when the content changed.

#### Scenario: Files changed after a pull
- **WHEN** a model file changes and a request arrives more than a minute after the last check
- **THEN** the response reflects the new content

#### Scenario: Files touched but unchanged
- **WHEN** a file's modification time changes but its content does not
- **THEN** the model is not rebuilt

#### Scenario: Check interval not elapsed
- **WHEN** a request arrives less than a minute after the last check
- **THEN** the files are not read again

#### Scenario: Manual reload
- **WHEN** a reload is requested explicitly
- **THEN** the model is rebuilt immediately, whatever the interval

### Requirement: Shared context definitions are part of the model
The system SHALL read the shared context definitions that sit beside the namespaces' model files, and SHALL treat a change to them like a change to any other model file.

#### Scenario: Definitions changed
- **WHEN** the shared context definitions change and a request arrives after the check interval
- **THEN** the response reflects the new definitions

#### Scenario: Definitions missing
- **WHEN** the shared context definitions are not present
- **THEN** tables still report which contexts they have, without fields

### Requirement: A namespace is the name declared in its files
The system SHALL identify a namespace by the name declared inside its model files, and SHALL merge the content of every folder that declares the same name into one namespace.

#### Scenario: Namespace in two folders
- **WHEN** two folders declare the same namespace name
- **THEN** the namespace appears once, with the tables, types and enums of both folders

#### Scenario: Description from the primary folder
- **WHEN** only one of the folders gives the namespace a description
- **THEN** the merged namespace has that description

#### Scenario: Links into a merged namespace
- **WHEN** a table links to a table that was defined in the second folder of a merged namespace
- **THEN** the link resolves to that table
