# Design

## Context

The public NQL API (execute) runs only saved queries by identifier; a request can pass parameter values that
replace placeholders in the saved query. It cannot take query text. The bearer token and tenant address are per tenant.
A field-picker dialog needs the query to depend on the chosen table and fields, and charts need many different aggregations.

## Goals / Non-Goals

**Goals:**
- Pick fields per table and see example rows.
- Keep credentials on the server.
- Mask personal-data fields by default.

**Non-Goals:**
- Customer tenants, authentication of explorer users (separate decision), writing data.

## Decisions

- **Preferred route (weakly grounded): one generic saved query** on a non-customer tenant that takes the table and field
  list as parameters. Needs a real token to find out whether placeholders may stand in for table names and field lists.
- **Fallback: ClickHouse directly** (dev cluster over the tunnel), building SQL from the store model's tables and columns.
  Allows any field selection and the aggregations charts need; results use column names, not NQL names.
- **One saved query per table** and an internal query service were considered and rejected for v1 of this change:
  the first defeats the field picker, the second is undocumented.
- **Personal data masked by default**, using the model's personal-data flag; an explicit toggle reveals it.

## Risks / Trade-offs

- [Placeholders cannot carry table and field names] -> switch to the ClickHouse route.
- [Real personal data shown] -> non-customer tenant only, masking by default, no export.

## Open Questions

- Which tenant, and is there an API client (id and secret) available to test with?
- What the dialog supports beyond field choice (time range, row limit, sort, filters).
