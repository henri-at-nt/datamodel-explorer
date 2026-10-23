# Tasks

## 1. Server

- [x] 1.1 Read `businessConfigObjects` as object links (text names the config object); verify with unit tests on the made-up model.
- [x] 1.2 Produce incoming links once after all namespaces are built, across namespaces, with the namespace in the name; verify with unit tests, including a cross-namespace case.
- [x] 1.3 Report `parentObjectName` as a parent relation with its inverse; verify with a unit test.

## 2. Web and shared

- [x] 2.1 Diagram: at most twelve incoming relations drawn, one summary box for the rest; label for the parent relation; verify with a unit test of the diagram text.
- [x] 2.2 Show the parent relation in the list.

## 3. Verification

- [x] 3.1 Browser test: the campaign table links to Campaign and back, Application lists tables from other namespaces, the Device diagram stays at twelve incoming plus a summary box.
- [x] 3.2 Typecheck, unit tests, `openspec validate --all`; archive the change.
