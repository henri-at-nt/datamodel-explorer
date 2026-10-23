# Spec Delta

## ADDED Requirements

### Requirement: Many incoming links are summarised
The system SHALL draw at most twelve incoming relations individually and SHALL replace the rest with one box that says how many more there are, while the relation list shows all of them.

#### Scenario: More than twelve incoming links
- **WHEN** a table has more than twelve incoming relations
- **THEN** the diagram shows twelve, plus one box "and N more", and the list shows every relation

#### Scenario: Twelve or fewer
- **WHEN** a table has twelve or fewer incoming relations
- **THEN** every one is drawn
