# Tasks

## 1. Project setup

- [x] 1.1 Create the repository layout (shared, server, web workspaces), TypeScript config, `.gitignore`, `.nvmrc`; verify with `npm install` and `npm run typecheck`.
- [x] 1.2 Initialise OpenSpec and write the v1 change; verify with `openspec validate v1-explorer`.

## 2. Server

- [x] 2.1 Port the table generator (fields, metrics, structured types, collections, relations, enums, storage) including config objects, linkages and JSON types; verify with the parity script on all 32 namespaces.
- [x] 2.2 Port the store-graph generator; verify with the parity script (diagram text, hover details, counts).
- [x] 2.3 Resolve cross-namespace object links.
- [x] 2.4 Add the model cache with content-hash invalidation (at most once a minute) and the reload endpoint.
- [x] 2.5 Add the API (namespaces, namespace detail, search, health) and static serving with client-route fallback; verify with `curl` and the server tests.
- [x] 2.6 Unit tests on a made-up model: generators, cache interval and invalidation, API, search ranking.

## 3. Web app

- [x] 3.1 App shell, two-level navigation, routes, not-found view.
- [x] 3.2 Store overview with hover popup and zoom.
- [x] 3.3 Table page: header, summary-card filters, fields, structured fields, enums, storage.
- [x] 3.4 Relationship diagram with list alternative; cross-links across namespaces.
- [x] 3.5 Global search with `/` shortcut and keyboard selection.
- [x] 3.6 Light and dark theme; layout works at phone width.

## 4. Verification

- [x] 4.1 Run the Python parity script against all 32 namespaces; all must match. Then the Python generators are no longer needed.
- [x] 4.2 Browser test: open every namespace overview and every table page, check relationship diagrams, cross-namespace link, direct URL load, search; no console errors.
- [x] 4.3 README: how to run, configure the model folder, and develop.
