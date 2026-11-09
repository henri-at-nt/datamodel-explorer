import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stopOnSignals } from "../src/shutdown";

afterEach(() => vi.useRealTimers());

function setup(close: () => Promise<unknown>) {
  const fake = new EventEmitter();
  const exit = vi.fn();
  const app = { close: vi.fn(close) };
  stopOnSignals(app, { processLike: fake, exit, forceAfterMs: 2000 });
  return { fake, exit, app };
}

describe("stopOnSignals", () => {
  it.each(["SIGINT", "SIGTERM", "SIGHUP"])("closes the server and exits on %s", async (signal) => {
    const { fake, exit, app } = setup(() => Promise.resolve());
    fake.emit(signal);
    await Promise.resolve();
    await Promise.resolve();
    expect(app.close).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("exits anyway when a connection keeps the listener from closing", () => {
    vi.useFakeTimers();
    const { fake, exit } = setup(() => new Promise(() => {})); // never resolves
    fake.emit("SIGTERM");
    expect(exit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("closes only once when several signals arrive", async () => {
    const { fake, app } = setup(() => Promise.resolve());
    fake.emit("SIGTERM");
    fake.emit("SIGHUP");
    expect(app.close).toHaveBeenCalledOnce();
  });

  it("exits with an error code when closing fails", async () => {
    const { fake, exit } = setup(() => Promise.reject(new Error("boom")));
    fake.emit("SIGTERM");
    await Promise.resolve();
    await Promise.resolve();
    expect(exit).toHaveBeenCalledWith(1);
  });
});
