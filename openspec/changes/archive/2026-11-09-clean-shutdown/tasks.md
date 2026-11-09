# Tasks

## 1. Implementation

- [x] 1.1 Server: close on SIGINT, SIGTERM and SIGHUP and force-exit after two seconds; verify with a unit test of the shutdown helper.
- [x] 1.2 Launcher script for `npm run dev`: process groups, stop sequence, parent-loss check, prefixed output; remove `concurrently`.

## 2. Verification

- [x] 2.1 A repeatable check against a real dev server: SIGTERM, SIGINT, SIGHUP and killing the parent each leave nothing running and the ports free.
- [x] 2.2 Typecheck, unit tests, `openspec validate --all`, README; archive the change.
