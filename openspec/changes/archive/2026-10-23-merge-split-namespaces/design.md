# Design

## Context

Each feature folder holds a data model file and a store model file, both declaring a namespace name. In 28 folders the name
equals the folder name; in four it does not. In the four, the folder with the matching name holds the namespace's description
and most of its content, and the other folder adds tables, types and enums. Checked against the model: no table, type or enum
name occurs in both folders of a pair, and the extra folders carry no description.

## Goals / Non-Goals

**Goals:**
- One namespace per declared name, with the content of every folder that declares it.

**Non-Goals:**
- Handling two folders that define the same table; the model does not do this, so the explorer does not decide what it would mean.

## Decisions

- **Merge by the declared name, in the loader.** Lists (tables, types, enums and so on) are joined, folder with the matching name first;
  other values (description) are taken from the first folder that has them. Everything after the loader sees only merged namespaces,
  so no later step needs to know about folders.
- **Record the source folders** on the namespace, so the overview can say where it comes from.
- **Same for the store model**, by the same rule.

## Risks / Trade-offs

- [A future duplicate table name in two folders would appear twice] -> the unit tests show the merge adds, and the browser test checks that table addresses are unique per namespace.
- [Old addresses such as /mobile_device/mobile_device stop working] -> accepted; they were never real namespaces.
