# Proposal

## Why

In a relationship diagram, tables from other namespaces are labelled with their title only. Application's diagram
shows two boxes called "Event" (from different namespaces) and a bare "Tickets", so people cannot tell them apart.

## What Changes

- A box for a table in another namespace carries that namespace in its label, for example "Event (web)". Tables in the same namespace stay as they are.

## Capabilities

### New Capabilities

### Modified Capabilities
- `relationship-diagram`: boxes for tables in other namespaces name their namespace.

## Impact

- Diagram text only; no API change.
