# Proposal

## Why

Most timeseries tables are enriched with contexts (operating system, location, organization, sometimes browser or VDI client).
Each context is drawn as a separate box with a separate line, so a table with five contexts has five extra branches
in its relationship diagram, and the boxes say nothing about what the context offers.

## What Changes

- All contexts of a table become one relation, "context", in the relation list and the diagram.
- The diagram draws one context box, placed on the right of the other related boxes, listing each context the table has and the fields that context offers.
- Which contexts and fields appear depends on the table: the model gives each table its own set of contexts, and each context has its own fields.
- The fields come from the model's shared context definitions, so those definitions are read, and changes to them refresh the model.

## Capabilities

### New Capabilities

### Modified Capabilities
- `model-api`: a table reports its contexts with their fields, and one context relation instead of one per context.
- `model-source`: the shared context definitions are part of the model files.
- `relationship-diagram`: contexts are drawn as one box on the right.

## Impact

- API: tables gain a `contexts` list; the number of relations on tables with contexts goes down (a table with three contexts loses two).
- Web: the diagram and the relation list change; the "relations" count on a page is lower for tables with contexts.
