# Design

## Context

Measured on the current setup, with a browser-style connection and a hot-reload WebSocket open: SIGTERM and SIGINT sent to the top process
end everything within a second; SIGHUP and SIGKILL sent to the top process leave all four processes running and serving. The top process is
`npm`, which does not pass SIGHUP on, and `concurrently` does not act on it.

## Goals / Non-Goals

**Goals:**
- Whatever stops the development command, no process of it outlives it by more than a few seconds.

**Non-Goals:**
- Surviving or handling a SIGKILL of the launcher itself (it cannot be caught); its parent-loss check covers the usual causes.
- Changing how the production command is started.

## Decisions

- **A launcher script instead of `concurrently`.** It starts the API watcher and the web dev server directly, each in its own process group,
  so a signal reaches the watcher's child as well. This removes a dependency. Alternative: keep `concurrently` and add flags; it has no hangup handling.
- **Stop sequence:** on SIGINT, SIGTERM, SIGHUP or SIGQUIT, send SIGTERM to each group, wait up to three seconds, send SIGKILL to what is left, exit.
- **Parent-loss check:** every second the launcher compares its parent process id with the one it started with, and stops if it changed. This covers the
  process above it being killed or hung up, which cannot be signalled to the launcher.
- **If one child exits, stop the other**, so the page never half-works.
- **The server closes its listener on stop signals and force-exits after two seconds**, so a stuck connection cannot keep it alive.

## Risks / Trade-offs

- [A watcher restart looks like a child exit] -> only the watcher's own child restarts; the watcher process the launcher started stays up.
- [A stop signal arrives while starting] -> the same stop sequence runs.
