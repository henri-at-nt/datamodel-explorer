# Design

## Decisions

- **One supervisor, two commands.** The launcher logic moves to a shared module that takes a list of processes; the development command passes two, the production command one.
  Alternative: copy the launcher; rejected as two places to keep correct.
- **No file watching for `start`.** It runs the server once, as before.

## Risks / Trade-offs

- [Someone wants the server to outlive the shell that started it] -> run it under a process supervisor; the parent check is the point of this change.
