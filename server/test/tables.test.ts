import { describe, expect, it } from "vitest";
import { fixtureModel } from "./helpers";

const demo = () => fixtureModel().byName.get("demo")!;
const table = (key: string) => demo().tables.find((t) => t.key === key)!;

describe("tables", () => {
  it("includes timeseries, objects, collections, config objects and linkages", () => {
    // Ordered by kind; within a kind the namespace's main folder comes first, then the second folder
    // (ts_extra_visit and obj_visitor).
    expect(demo().tables.map((t) => `${t.kind}:${t.key}`)).toEqual([
      "timeseries:ts_visit", "timeseries:ts_ghost_event", "timeseries:ts_extra_visit",
      "object:obj_person", "collection:col_person_gadgets", "object:obj_visitor",
      "configObject:cfg_catalog", "configObject:cfg_shelf", "linkage:link_membership",
    ]);
  });

  it("gives each collection a table of its own, named the way NQL names it", () => {
    const gadgets = table("col_person_gadgets");
    expect(gadgets).toMatchObject({
      kind: "collection", name: "person.gadgets", collection: "gadgets", label: "Gadget", parent: "obj_person",
      description: "A gadget a person owns.",
    });
    expect(gadgets.fields).toEqual([expect.objectContaining({ name: "model", jsonPath: "modelName", role: "field" })]);
  });

  it("links a collection back to its parent and the parent to the collection", () => {
    expect(table("col_person_gadgets").relations).toEqual([
      expect.objectContaining({ direction: "in", via: "collection", target: "obj_person", targetName: "person" }),
    ]);
    const out = table("obj_person").relations.find((r) => r.via === "collection")!;
    expect(out).toMatchObject({ direction: "out", target: "col_person_gadgets", targetName: "person.gadgets" });
  });

  it("declares no storage for a collection", () => {
    expect(table("col_person_gadgets").store).toEqual({ topic: null, tables: [], columns: [] });
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
      "out:structured field:weather", "out:object link:person", "out:object link:place", "out:object link:catalog",
      "out:context:context",
    ]);
    const person = table("obj_person");
    expect(person.relations.filter((r) => r.direction === "in").map((r) => r.target)).toEqual(["ts_visit", "link_membership"]);
  });

  it("reports links to configured objects like any other object link", () => {
    const link = table("ts_visit").relations.find((r) => r.targetName === "catalog")!;
    expect(link).toMatchObject({ direction: "out", via: "object link", target: "cfg_catalog" });
    expect(link.text).toContain("config object");
  });

  it("lists, on a configured object, everything that links to it, including other namespaces", () => {
    const incoming = table("cfg_catalog").relations.filter((r) => r.direction === "in").map((r) => `${r.via}:${r.targetName}:${r.target}`);
    expect(incoming).toEqual([
      "object link:visit:ts_visit", "parent object:shelf:cfg_shelf", "object link:membership:link_membership",
      "object link:other.sighting:other::ts_sighting",
    ]);
  });

  it("reports the parent of a configured object on both ends", () => {
    expect(table("cfg_shelf").relations).toEqual([
      expect.objectContaining({ direction: "out", via: "parent object", target: "cfg_catalog", targetName: "catalog" }),
    ]);
    expect(table("cfg_catalog").relations.find((r) => r.via === "parent object")).toMatchObject({ direction: "in", label: "child" });
  });

  it("reports incoming links in another namespace with the namespace in the name", () => {
    const place = fixtureModel().byName.get("other")!.tables.find((t) => t.key === "obj_place")!;
    expect(place.relations).toEqual([
      expect.objectContaining({ direction: "in", via: "object link", target: "demo::ts_visit", targetName: "demo.visit" }),
    ]);
  });

  it("reports all contexts of a table as one relation that names them and their fields", () => {
    const contextRelations = table("ts_visit").relations.filter((r) => r.via === "context");
    expect(contextRelations).toHaveLength(1);
    expect(contextRelations[0].text).toBe("Enriched by 2 contexts: region (country, zone); owner (entity)");
  });

  it("gives each table its own contexts", () => {
    expect(table("ts_visit").contexts.map((c) => c.name)).toEqual(["region", "owner"]);
    const sighting = fixtureModel().byName.get("other")!.tables.find((t) => t.key === "ts_sighting")!;
    expect(sighting.contexts.map((c) => c.name)).toEqual(["lighting", "remote", "mystery"]);
  });

  it("reports a plain context with its fields and a key field first", () => {
    expect(table("ts_visit").contexts).toEqual([
      { name: "region", composite: false, groups: [{ name: "region", fields: ["country", "zone"] }] },
      { name: "owner", composite: false, groups: [{ name: "owner", fields: ["entity"] }] },
    ]);
  });

  it("reports a composite context with each of its groups", () => {
    const sighting = fixtureModel().byName.get("other")!.tables.find((t) => t.key === "ts_sighting")!;
    expect(sighting.contexts[1]).toEqual({
      name: "remote", composite: true,
      groups: [{ name: "region", fields: ["country", "zone"] }, { name: "owner", fields: ["entity"] }],
    });
  });

  it("still reports a context the shared definitions do not define, without fields", () => {
    const sighting = fixtureModel().byName.get("other")!.tables.find((t) => t.key === "ts_sighting")!;
    expect(sighting.contexts[2]).toEqual({ name: "mystery", composite: false, groups: [] });
    expect(sighting.relations.find((r) => r.via === "context")!.text).toContain("mystery");
  });

  it("reports no context relation for a table without contexts", () => {
    expect(table("ts_ghost_event").contexts).toEqual([]);
    expect(table("ts_ghost_event").relations.some((r) => r.via === "context")).toBe(false);
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
