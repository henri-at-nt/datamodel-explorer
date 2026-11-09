# Proposal

## Why

`npm start` has the same fault the development command had: a hangup signal, or the death of the process that started it,
leaves the server running, because `npm` does not pass a hangup on.

## What Changes

- `npm start` runs the server through the same supervisor as the development command, so it stops on the same signals and when its parent is gone.

## Capabilities

### New Capabilities

### Modified Capabilities
- `server-lifecycle`: the production command stops like the development command.

## Impact

- `npm start` output lines are prefixed `[server]`. The shutdown check covers both commands.
