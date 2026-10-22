import { appendFileSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ModelCache } from "../src/model/cache";
import { copyFixture } from "./helpers";

const demoFile = (dir: string) => join(dir, "feature/demo/nql-data-model.json");

function setup() {
  const dir = copyFixture();
  let now = 1_000_000;
  const cache = new ModelCache(dir, { checkIntervalMs: 60_000, now: () => now });
  return { dir, cache, advance: (ms: number) => (now += ms) };
}

describe("model cache", () => {
  it("builds once and serves the same model within the interval", () => {
    const { cache, advance } = setup();
    const first = cache.get();
    advance(59_000);
    expect(cache.get()).toBe(first);
  });

  it("does not read the files again before the interval has passed", () => {
    const { dir, cache, advance } = setup();
    const first = cache.get();
    appendFileSync(demoFile(dir), "\n"); // content change, but too early to notice
    advance(10_000);
    expect(cache.get()).toBe(first);
  });

  it("rebuilds after the interval when the content changed", () => {
    const { dir, cache, advance } = setup();
    const first = cache.get();
    appendFileSync(demoFile(dir), " ");
    advance(61_000);
    expect(cache.get()).not.toBe(first);
  });

  it("keeps the model when only the modification time changed", () => {
    const { dir, cache, advance } = setup();
    const first = cache.get();
    const later = new Date(Date.now() + 3_600_000);
    utimesSync(demoFile(dir), later, later);
    advance(61_000);
    expect(cache.get()).toBe(first);
  });

  it("reload rebuilds regardless of the interval", () => {
    const { cache } = setup();
    const first = cache.get();
    expect(cache.reload()).not.toBe(first);
  });

  it("reports counts and a content hash", () => {
    const { cache } = setup();
    expect(cache.info()).toMatchObject({ ok: true, namespaces: 2, tables: 6 });
    expect(cache.info().fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });
});
