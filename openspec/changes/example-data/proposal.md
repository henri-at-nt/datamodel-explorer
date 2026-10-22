# Proposal

## Why

The explorer shows what the model says, not what the data looks like. People want to pick fields of a table
and see real rows, and later chart them, without leaving the explorer.

## What Changes

- A per-table dialog to choose fields and show example rows from a real back-end.
- Personal-data fields are masked by default.
- Later: histograms, heat maps, bar and line charts over the same data.

This change is a draft. It is not started until v1 (`v1-explorer`) is complete and the open question in design.md is answered.

## Capabilities

### New Capabilities
- `example-data`: choosing fields of a table and viewing example rows from a back-end, with personal data masked by default.

### Modified Capabilities

## Impact

- The server gains a back-end client and credentials (environment variables, never sent to the browser).
- Real tenant data may reach the screen: only a non-customer tenant is allowed.
