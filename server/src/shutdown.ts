import type { EventEmitter } from "node:events";

export interface ShutdownOptions {
  /** How long to wait for the listener to close before exiting anyway. Default: two seconds. */
  forceAfterMs?: number;
  signals?: NodeJS.Signals[];
  /** Replaceable for tests. */
  processLike?: Pick<EventEmitter, "on">;
  exit?: (code: number) => void;
}

/**
 * Closes the server and exits when asked to stop. A hangup counts too: it is what a closing terminal or session sends.
 * Exits within `forceAfterMs` even if a connection keeps the listener from closing.
 */
export function stopOnSignals(
  app: { close(): Promise<unknown> },
  { forceAfterMs = 2000, signals = ["SIGINT", "SIGTERM", "SIGHUP"], processLike = process, exit = process.exit }: ShutdownOptions = {},
): void {
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    setTimeout(() => exit(0), forceAfterMs).unref();
    app.close().then(() => exit(0), () => exit(1));
  };
  for (const signal of signals) processLike.on(signal, stop);
}
