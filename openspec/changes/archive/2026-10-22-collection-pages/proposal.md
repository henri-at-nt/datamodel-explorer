# Proposal

## Why

In NQL and the product documentation, `device.cpus`, `device.gpus` and the other device inventory lists are queried
like tables. In the model they are JSON-array collections on the Device object, so the explorer shows them only
inside Device's structured fields. People looking for `device.cpus` in the navigation or in search do not find it.

## What Changes

- Each collection of an object becomes a page of its own, named the way NQL names it (`device.cpus`), listed beneath its parent table in the navigation.
- The page shows the fields of the element type, with their JSON paths, and links back to the parent table.
- The parent table's relationship diagram links to the collection page.
- Search finds collections by their NQL name.
- The page says that the store model declares no storage of its own for a collection; it does not guess where the data is stored.

## Capabilities

### New Capabilities

### Modified Capabilities
- `navigation-and-routing`: collections are listed, indented, beneath their parent table.
- `table-detail`: collections have their own kind of page.
- `model-api`: collections are returned as tables of their namespace.
- `search`: collections are found by their NQL name.

## Impact

- API: namespace detail gains one table per collection (nine in the device namespace today); summaries mark a collection's parent.
- Web: navigation indents collections; the field table shows a JSON path column when fields have one.
- Table counts grow (114 to 123). Tests and the browser test cover the new pages.
