# Design

## Context

The explorer started as three Python generators that wrote one self-contained HTML file. The model is 64
JSON files (about 2.7 MB) in a local clone of data-platform.data-model-content: per namespace, a data model
(tables, fields, enums) and a store model (Kafka topics, ClickHouse tables, column mappings). See proposal.md for why.
Later changes add example data from a real tenant and charts, so the server must be the only place that
talks to anything outside the browser.

## Goals / Non-Goals

**Goals:**
- Same content as the HTML file, on real URLs, with global search.
- A model layer the later example-data and chart features can build on.
- Output identical to the Python generators, verified before they are retired.

**Non-Goals:**
- Authentication and hosting (decided later; the app must not hard-code paths or addresses).
- Example data, the field-picker dialog, charts.
- Inferring feeds the store model does not declare.

## Decisions

- **Server computes, browser renders.** The server turns the raw model into the same table, type, enum and
  store-graph records the Python scripts produced. The browser builds the diagram text from them.
  Alternative: precompute static JSON at build time; rejected because a `git pull` of the model should show
  up without a rebuild.
- **Content hash for invalidation, at most once a minute.** Hash all model files; rebuild when the hash changes.
  Alternatives: the clone's HEAD commit (misses uncommitted edits, needs `.git`), modification times (false
  positives after `touch`, depends on checkout behaviour), `fs.watch` (recursive watching is unreliable on macOS).
  Reading and hashing 2.7 MB takes about ten milliseconds, and one rebuild takes under 100 ms.
- **One process, one repository.** A Fastify server with an `/api` prefix; in production it also serves the built
  web app and falls back to the app's `index.html` for client routes. Development runs the Vite dev server with a proxy.
  Workspaces: `shared` (types and diagram-text builders, used by both sides), `server`, `web`.
- **TypeScript everywhere, React + Vite for the web app.** Shared types keep the API and the app in step.
- **Mermaid for diagrams, version pinned and bundled.** The diagrams are known to be good enough for now; replacing
  them is a later change. Pinned at 10.9.1 because the hover handling relies on the element ids that version produces.
- **Cross-namespace targets as `<namespace>::<key>`.** Resolved on the server once all namespaces are built.
- **Search is a linear scan in memory** over about 114 tables and a few thousand fields; no search library.
- **Python is a reference, not a dependency.** A one-off script compares the new output with the Python output for
  every namespace; after it passes, the Python scripts are no longer needed.

## Risks / Trade-offs

- [The model format changes and the generators misread it] -> unit tests on a made-up model, plus the end-to-end test that opens every table.
- [Mermaid ids change in a newer version and break hover] -> version is pinned; the hover test covers it.
- [Large namespaces make the store diagram huge] -> zoom and fit-to-width, as before; a better diagram is a later change.
- [Real model content leaks into the repository through tests] -> fixtures are made up; the content folder is never copied.
