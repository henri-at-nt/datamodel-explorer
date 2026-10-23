# Design

## Context

Each timeseries names the contexts it has (`context/operating_system`, `context/location`, `context/organization`,
and for some `context/browser`, `context/location_geo_ip`, `context/vdi_client`). Six combinations exist in the model; 28 tables have none.
The entries carry only the name. What a context offers is defined once, in the shared definitions
(`content/common/nql-data-model.json`): groups with fields (operating system: name, platform; browser: version; location and
location_geo_ip: state, country, type and one more), an organization group with a key field (entity), and one composite type
(`vdi_client`) made of the operating system, location and organization groups.

## Goals / Non-Goals

**Goals:**
- One context relation per table, and a box that tells what is available through it.
- The box is specific to the table.

**Non-Goals:**
- Giving the NQL path of each context field (the model does not state how a composite context is addressed, so the explorer does not invent one).
- A page for each context.

## Decisions

- **Resolve contexts on the server, attach them to the table** (`contexts`: name, whether it is composite, groups with field names).
  The diagram builder and the page then need no second lookup. Alternative: a separate contexts endpoint; rejected for a small payload and an extra request per page.
- **One relation, many details.** The relation list keeps one "context" entry whose explanation lists contexts and fields, so the list is informative on its own.
- **The box is drawn last** among the outgoing boxes, so the layout puts it at the right edge of its row. A diagram engine cannot pin a box to a side, but order within a row is respected.
- **Plain contexts show `name: fields`; a composite context shows its name and one line per group.**
- **A context the shared definitions do not define is still shown, by name, without fields**, rather than hidden.
- **The shared definitions file is hashed with the rest**, so editing it refreshes the model.

## Risks / Trade-offs

- [The box is wide when a table has many contexts] -> fields of one context stay on one line; the box grows in height first.
- [The right-hand placement is a layout hint, not a guarantee] -> the box is always last in its row; accepted.
