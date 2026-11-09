# Tasks

## 1. Implementation

- [x] 1.1 Move the launcher logic into a shared module; `npm run dev` and `npm start` both use it; verify that `npm run dev` still passes the shutdown check.
- [x] 1.2 Extend the shutdown check to `npm start`; verify it fails against the old start command and passes now.

## 2. Verification

- [x] 2.1 Typecheck, unit tests, `openspec validate --all`, README; archive the change.
