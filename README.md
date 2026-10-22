# datamodel-explorer

A local web app for exploring the Nexthink NQL data model and store model: namespaces, tables, fields,
relationships, enums and how each table is stored in ClickHouse.

It reads the model files straight from a clone of `data-platform.data-model-content`. No model content is
stored in this repository.

## Run it

Needs Node 22 or newer.

```bash
npm install
npm run build
npm start          # http://127.0.0.1:3000
```

The model folder defaults to `../../repos/data-platform.data-model-content/content` (the clone in the Endpoint
studio workspace). To use another clone, set `DATA_MODEL_CONTENT_DIR` to its `content` folder; see `.env.example`.

The model is built on the first request and kept in memory. At most once a minute, the next request hashes the
model files and rebuilds if they changed, so a `git pull` of the model clone shows up without a restart.
`POST /api/reload` rebuilds immediately.

## Develop

```bash
npm run dev        # API on :3000, web app with hot reload on http://localhost:5173
npm run typecheck
npm test           # server unit tests, on a made-up model
npm run build && npm start   # then, in another terminal:
npm run e2e        # opens every namespace and table in a headless Chrome
```

`npm run e2e` uses `playwright-core` and needs a Chrome: set `BROWSER_PATH`, or let it find a Chrome for Testing in the
Playwright cache. `E2E_URL` points it at a server other than `http://127.0.0.1:3000`.

## Layout

| Folder | Contents |
|---|---|
| `shared/` | API types and the Mermaid text builders used by both sides |
| `server/` | Fastify API, model generators, cache, search, tests |
| `web/` | React + Vite app |
| `openspec/` | Specs (`specs/`) and change proposals (`changes/`), maintained with [OpenSpec](https://github.com/Fission-AI/OpenSpec) |
| `scripts/` | End-to-end browser test |

## Specs

Behaviour is specified with OpenSpec. `openspec/changes/v1-explorer` describes this version.
`openspec/changes/example-data` is a draft for showing example rows from a real back-end; it is not started.

```bash
npx openspec list
npx openspec validate --all
```

Specs, fixtures and tests must not contain real model content (table, field or enum names, descriptions).

## API

| Path | Returns |
|---|---|
| `GET /api/namespaces` | Namespaces with their tables |
| `GET /api/namespaces/:ns` | One namespace in full: tables, types, enums, store graph |
| `GET /api/search?q=` | Tables, fields and enums matching the query |
| `GET /api/health` | Content hash, build time, counts |
| `POST /api/reload` | Rebuilds the model now |
