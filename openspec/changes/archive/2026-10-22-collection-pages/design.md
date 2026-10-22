# Design

## Context

The model's `collections` entry on an object names a JSON-array field and the JSON type of its elements
(for example `cpus` of type `cpu`). The generators already read these as structured fields; the element type's fields
and JSON paths are already in the namespace's type index. See proposal.md.

## Goals / Non-Goals

**Goals:**
- Make each collection reachable like a table, by the name NQL users know.
- Reuse the table page rather than build a second kind of page.

**Non-Goals:**
- Finding out where collection data is stored in ClickHouse.
- Making platform JSON types (used as structured fields of log tables) into pages; only collections are.

## Decisions

- **A collection is a table of kind `collection`.** The server derives one per entry in an object's `collections`, with
  key `col_<object>_<collection>`, name `<object>.<collection>`, the element type's label as title, and its fields.
  Alternative: build the pages in the browser from the type index; rejected so the API, search and the browser test
  all see collections the same way.
- **The parent is recorded** (`parent`: the parent table's key) so navigation can indent collections and pages can link back.
- **The parent's collection relation targets the collection table**, not the bare type, so the diagram shows a table box and links to it.
  The inline field list under "structured fields" stays.
- **The URL segment is the NQL name** (`/device/device.cpus`). The dot is checked in both the Vite dev server and the production server.
- **Storage stays empty and the page says so**, because the store model has no entry for the collection.

## Risks / Trade-offs

- [A dot in the URL is treated as a file extension by a server] -> test direct load in development and production.
- [Many "name" fields from collections add search noise] -> same ranking as other fields; collection pages rank by their own name first.
