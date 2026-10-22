# Tasks

## 1. Server

- [x] 1.1 Derive a collection table per object collection (key, name, title, fields with JSON paths, parent, relation back to the parent), and point the parent's collection relation at it; verify with unit tests on the made-up model.
- [x] 1.2 Carry `kind` and `parent` through the namespace list and search; verify with unit tests (search for the collection's NQL name ranks it first).

## 2. Web

- [x] 2.1 Indent collections beneath their parent in the navigation; verify in the browser test.
- [x] 2.2 Collection page: header, JSON path column, link to the parent, storage message; verify in the browser test and by reading the page.

## 3. Verification

- [x] 3.1 Browser test over every namespace and table (now including collections), direct load of `/device/device.cpus` in production and development.
- [x] 3.2 `openspec validate --all`, typecheck, unit tests, and the README's counts if they changed.
