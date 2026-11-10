# Proposal

## Why

Each field in the data model carries more documentation than the label and description the page shows: a `details` text, a `requirements` text and, for deprecated fields, a deprecation reason. 433 fields have details, 215 have requirements and 114 are deprecated. The page drops all of it.

## What Changes

- The model API returns `details`, `requirements` and `deprecation` (reason, and since-version where the model has one) for every field and metric.
- The field list shows a "Deprecated" marker with the reason next to the description, and an expandable "More" section with the details and requirements.
- The field lists of structured types and collections show the same.

## Capabilities

### New Capabilities

### Modified Capabilities
- `model-api`: fields carry details, requirements and deprecation.
- `table-detail`: the field list shows them.

## Impact

- Search is unchanged. The model contains no other documentation fields that the page ignores for fields.
