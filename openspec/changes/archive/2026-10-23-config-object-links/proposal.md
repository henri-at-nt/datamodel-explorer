# Proposal

## Why

A table can link to a configured object (a campaign, an application, an alert monitor) as well as to an object
such as a device or user. The explorer only reads the second kind. For example `campaign.response` has a
`campaign_id` column in its storage mappings but no relationship to the Campaign table; 78 such links are missing
across the model, and none of the pages for config objects say which tables point at them. Links are also
reported from one end only, and only inside a namespace.

## What Changes

- Links from a timeseries or linkage to a config object are reported like links to any other object.
- Links are reported from both ends, including across namespaces: the Application page lists the tables in other namespaces that link to it.
- A config object's parent (for example `application` for a page or transaction) is reported as a relation, from both ends.
- The relationship diagram summarises large numbers of incoming links in one box instead of drawing each; the list still shows all of them.

## Capabilities

### New Capabilities

### Modified Capabilities
- `model-api`: object links include config objects, are reported from both ends across namespaces, and parents are reported.
- `relationship-diagram`: many incoming links are summarised.

## Impact

- API: tables gain relations (78 outgoing links plus their incoming counterparts, plus two parent links); no field is removed or renamed.
- Web: pages show the new relations in the diagram and the list; no layout change except the summary box.
- Device, User and Application pages gain many incoming relations from other namespaces.
