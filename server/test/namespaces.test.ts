import { describe, expect, it } from "vitest";
import { buildModel } from "../src/model/build";
import { loadRaw } from "../src/model/raw";
import { FIXTURE_DIR, fixtureModel } from "./helpers";

const demo = () => fixtureModel().byName.get("demo")!;

describe("a namespace split across folders", () => {
  it("is one namespace, named by what the files declare", () => {
    expect(fixtureModel().summaries.map((s) => s.name)).toEqual(["demo", "other"]);
  });

  it("names every folder it comes from, the one named like the namespace first", () => {
    expect(demo().sources).toEqual(["demo", "aa_demo_extra"]);
    expect(fixtureModel().byName.get("other")!.sources).toEqual(["other"]);
  });

  it("contains the tables of both folders, the primary folder's first", () => {
    const keys = demo().tables.map((t) => t.key);
    expect(keys.indexOf("ts_visit")).toBeLessThan(keys.indexOf("ts_extra_visit"));
    expect(keys).toEqual(expect.arrayContaining(["ts_extra_visit", "obj_visitor"]));
  });

  it("keeps the description from the folder that has one", () => {
    const raw = loadRaw(FIXTURE_DIR).namespaces.find((n) => n.name === "demo")!;
    expect(raw.dm.documentation.description).toBe("The demo namespace.");
  });

  it("finds an enum defined in the second folder", () => {
    expect(demo().enums["demo/flavour"].values.map((v) => v.label)).toEqual(["sweet"]);
  });

  it("merges the store models too", () => {
    const ids = demo().store.entities.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(["st_extra_visit", "tbl_extra_visits_v", "so_visitor", "tbl_visitors_dict"]));
  });

  it("resolves a link into the second folder, and lists it on the other end", () => {
    const sighting = fixtureModel().byName.get("other")!.tables.find((t) => t.key === "ts_sighting")!;
    expect(sighting.relations.find((r) => r.targetName === "visitor")).toMatchObject({ target: "demo::obj_visitor" });
    const visitor = demo().tables.find((t) => t.key === "obj_visitor")!;
    expect(visitor.relations).toEqual([
      expect.objectContaining({ direction: "in", target: "other::ts_sighting", targetName: "other.sighting" }),
    ]);
  });

  it("leaves a namespace declared in one folder as it is", () => {
    const raw = loadRaw(FIXTURE_DIR);
    expect(raw.namespaces.map((n) => n.name)).toEqual(["demo", "other"]);
    expect(buildModel(raw).byName.get("other")!.tables.map((t) => t.key)).toEqual(["ts_sighting", "obj_place"]);
  });
});
