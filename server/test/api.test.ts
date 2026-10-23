import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { ModelCache } from "../src/model/cache";
import { FIXTURE_DIR } from "./helpers";

const cache = new ModelCache(FIXTURE_DIR);

describe("api", () => {
  it("reports health", async () => {
    const app = await buildApp({ cache });
    const res = await app.inject("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, namespaces: 2, tables: 11 });
  });

  it("lists namespaces", async () => {
    const app = await buildApp({ cache });
    expect((await app.inject("/api/namespaces")).json().map((n: { name: string }) => n.name)).toEqual(["demo", "other"]);
  });

  it("returns one namespace in full", async () => {
    const app = await buildApp({ cache });
    const body = (await app.inject("/api/namespaces/demo")).json();
    expect(body.tables).toHaveLength(9);
    expect(Object.keys(body.types)).toEqual(expect.arrayContaining(["type_ts_weather", "json_gadget"]));
    expect(body.store.entities.length).toBeGreaterThan(5);
  });

  it("answers an unknown namespace with a 404 that names it", async () => {
    const app = await buildApp({ cache });
    const res = await app.inject("/api/namespaces/nope");
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain("nope");
  });

  it("answers unknown API paths with a JSON 404, not the web app", async () => {
    const dist = mkdtempSync(join(tmpdir(), "dme-web-"));
    writeFileSync(join(dist, "index.html"), "<html>app</html>");
    const app = await buildApp({ cache, webDist: dist });
    const res = await app.inject("/api/nothing-here");
    expect(res.statusCode).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
  });

  it("searches", async () => {
    const app = await buildApp({ cache });
    const hits = (await app.inject("/api/search?q=duration")).json();
    expect(hits[0]).toMatchObject({ type: "field", title: "duration" });
  });

  it("serves the web app for client routes", async () => {
    const dist = mkdtempSync(join(tmpdir(), "dme-web-"));
    writeFileSync(join(dist, "index.html"), "<html>app</html>");
    const app = await buildApp({ cache, webDist: dist });
    const res = await app.inject("/demo/visit");
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("app");
  });
});
