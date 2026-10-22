import { describe, expect, it } from "vitest";
import { fixtureModel } from "./helpers";

const demo = () => fixtureModel().byName.get("demo")!;
const table = (key: string) => demo().tables.find((t) => t.key === key)!;

describe("tables", () => {
  it("includes timeseries, objects, config objects and linkages", () => {
    expect(demo().tables.map((t) => `${t.kind}:${t.key}`)).toEqual([
      "timeseries:ts_visit", "timeseries:ts_ghost_event", "object:obj_person", "configObject:cfg_catalog", "linkage:link_membership",
    ]);
  });

  it("lists fields and metrics with their role", () => {
    const visit = table("ts_visit");
    expect(visit.fields.map((f) => `${f.role}:${f.name}`)).toEqual(["field:reason", "field:mood", "field:shape", "metric:duration"]);
    expect(visit.fields[0]).toMatchObject({ label: "Reason", description: "Why the visit happened.", platforms: "all" });
  });

  it("includes the metrics of a structured type", () => {
    const type = demo().types["type_ts_weather"];
    expect(type.fields).toHaveLength(1);
    expect(type.fields[0]).toMatchObject({ name: "temperature", role: "metric" });
  });

  it("turns collections into JSON-array structured fields with JSON paths", () => {
    const person = table("obj_person");
    expect(person.structured).toEqual([
      expect.objectContaining({ name: "gadgets", typeName: "gadget", target: "json_gadget", targetKind: "jsonType", collection: true }),
    ]);
    expect(demo().types["json_gadget"].fields[0]).toMatchObject({ name: "model", jsonPath: "modelName" });
  });

  it("adds outgoing and incoming object links", () => {
    const visit = table("ts_visit");
    expect(visit.relations.map((r) => `${r.direction}:${r.via}:${r.targetName}`)).toEqual([
      "out:structured field:weather", "out:object link:person", "out:object link:place", "out:context:demo/season",
    ]);
    const person = table("obj_person");
    expect(person.relations.filter((r) => r.direction === "in").map((r) => r.target)).toEqual(["ts_visit", "link_membership"]);
  });

  it("resolves object links into another namespace", () => {
    const place = table("ts_visit").relations.find((r) => r.targetName === "place")!;
    expect(place.target).toBe("other::obj_place");
  });

  it("finds enums in the namespace that defines them", () => {
    const enums = demo().enums;
    expect(enums["demo/mood"].values.map((v) => v.label)).toEqual(["happy", "tired"]);
    expect(enums["other/shape"].values.map((v) => v.label)).toEqual(["round"]);
  });

  it("maps storage: topic, tables and columns, falling back to the NQL name", () => {
    const store = table("ts_visit").store;
    expect(store.topic).toBe("demo_visit_topic");
    expect(store.tables.map((t) => t.name)).toEqual(["visits_v", "visits_day_v"]);
    expect(store.columns).toEqual([
      { storeName: "visit_reason", dmRef: "reason", proto: "visit/reason" },
      { storeName: "mood", dmRef: "mood", proto: "" },
      { storeName: "visit_duration", dmRef: "duration", proto: "" },
    ]);
  });

  it("uses the single table of a config object", () => {
    expect(table("cfg_catalog").store.tables).toEqual([{ name: "catalog_dict", storageType: "dictionary" }]);
  });

  it("reports no topic when the store model declares none", () => {
    expect(table("ts_ghost_event").store.topic).toBeNull();
  });
});
