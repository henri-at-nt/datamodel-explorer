# Proposal

## Why

Stopping the development server with a hangup signal (what a closing terminal or session sends), or killing the process that started it, leaves
every process in the tree running: the launcher, the web dev server, the API and their file watchers keep their ports and never exit.
A host that stops the server and waits for it, such as an app shutting down or a machine powering off, then waits for processes that never end.

## What Changes

- The development command starts the API and the web dev server through a small launcher that stops both, and everything they started, on any stop signal.
- The launcher also stops them when the process that started it is gone.
- The server closes cleanly on stop signals and always exits within a few seconds.

## Capabilities

### New Capabilities
- `server-lifecycle`: how the server and the development command stop.

### Modified Capabilities

## Impact

- `npm run dev` no longer uses `concurrently`; output lines are prefixed `[server]` and `[web]`.
- The server process handles SIGINT, SIGTERM and SIGHUP.
- A new script checks the shutdown behaviour against a real dev server.
