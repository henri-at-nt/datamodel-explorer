import { describe, expect, it } from "vitest";
import { fixtureModel } from "./helpers";

describe("model", () => {
  it("lists namespaces alphabetically with table summaries", () => {
    const { summaries } = fixtureModel();
    expect(summaries.map((s) => s.name)).toEqual(["demo", "other"]);
    expect(summaries[0].tables[0]).toEqual({ key: "ts_visit", name: "visit", label: "visit", kind: "timeseries" });
    expect(summaries[0].storeEntities).toBeGreaterThan(0);
  });
});

describe("search", () => {
  const { search } = fixtureModel();

  it("ignores queries shorter than two characters", () => {
    expect(search("v")).toEqual([]);
  });

  it("is case-insensitive", () => {
    expect(search("VISIT")).toEqual(search("visit"));
  });

  it("ranks an exact table match before fields and enums", () => {
    const hits = search("visit");
    expect(hits[0]).toMatchObject({ type: "table", title: "visit", tableKey: "ts_visit", namespace: "demo" });
  });

  it("finds fields by name and opens the owning table", () => {
    expect(search("duration")[0]).toMatchObject({ type: "field", title: "duration", tableKey: "ts_visit" });
  });

  it("finds enums by name or value and points at a table that uses them", () => {
    expect(search("tired")[0]).toMatchObject({ type: "enum", title: "mood", tableKey: "ts_visit" });
  });

  it("matches descriptions with lower rank than names", () => {
    const hits = search("ghost");
    expect(hits[0].title).toBe("Ghost events");
    expect(search("visitor felt")[0]).toMatchObject({ type: "field", title: "mood" });
  });
});
