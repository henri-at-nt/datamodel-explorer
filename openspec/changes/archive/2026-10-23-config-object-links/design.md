# Design

## Context

A table's links are in two lists in the data model: `objects` and `businessConfigObjects`, each with a namespace and a name.
The explorer read only the first. The store model maps both kinds to a foreign-key column in its association mappings
(for example `campaign/campaign` to `campaign_id`), which is why the column already shows under storage.
Incoming links were produced per namespace, from the same list. Two config objects carry a `parentObjectName`.

## Goals / Non-Goals

**Goals:**
- Every declared link appears on both tables it connects, whatever namespace they are in.
- Keep the diagram readable for objects with many incoming links.

**Non-Goals:**
- Reading the store model's association mappings as relations (they repeat the declared links and add storage detail only).
- Deciding what a link means beyond what the model says.

## Decisions

- **Same relation kind for both lists.** A link to a config object is an "object link" like any other, so the page and diagram need no new vocabulary.
  The explanatory text says "config object" so the difference stays visible.
- **Incoming links are produced once, after all namespaces are built**, from the outgoing links that resolved to a table, instead of per namespace.
  This is the only way to see links that cross namespaces. Alternative: keep per-namespace and add a second cross-namespace pass; rejected as two mechanisms for one rule.
- **Parent object is its own relation kind** ("parent object"), drawn from child to parent and listed as "child" on the parent.
- **The diagram draws at most 12 incoming links**, and replaces the rest with one box "… and N more tables" so Device, User and Application stay legible.
  The list below the diagram always shows all of them. Alternative: group by namespace; rejected as more to explain for little gain.

## Risks / Trade-offs

- [A table that links to the same object under two names appears twice] -> accepted; the model declares it that way.
- [Incoming links from other namespaces make the list on Device very long] -> the list is collapsed by default; the diagram summarises.
