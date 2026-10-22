import { storeErSource } from "@dme/shared";
import { describe, expect, it } from "vitest";
import { fixtureModel } from "./helpers";

const graph = () => fixtureModel().byName.get("demo")!.store;
const entity = (id: string) => graph().entities.find((e) => e.id === id)!;

describe("store graph", () => {
  it("draws topics, NQL entities and ClickHouse tables", () => {
    const ids = graph().entities.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining([
      "topic_demo_visit_topic", "st_visit", "tbl_visits_v", "tbl_visits_day_v", "so_person", "sc_catalog", "tbl_catalog_dict", "sl_membership",
    ]));
  });

  it("labels ClickHouse tables with resolution and the NQL table", () => {
    expect(entity("tbl_visits_day_v").title).toBe("visits_day_v · 1d · NQL: Visit");
  });

  it("uses the model label for NQL entities and humanises bare names", () => {
    expect(entity("st_visit").title).toBe("NQL table: Visit");
    expect(entity("st_ghost_event").title).toBe("NQL table: Ghost events");
    expect(entity("so_person").title).toBe("NQL object: Person");
  });

  it("draws feeds only where the store model declares a topic", () => {
    const feeds = graph().relations.filter((r) => r.label === "feeds");
    expect(feeds.map((r) => r.to)).toEqual(expect.arrayContaining(["st_visit", "so_person", "sc_catalog"]));
    expect(feeds.some((r) => r.to === "st_ghost_event")).toBe(false);
  });

  it("keeps the hover details: column, NQL field and protobuf path", () => {
    expect(entity("st_visit").attrs).toContain('string visit_reason "reason <- visit/reason"');
    expect(entity("st_visit").attrs).toContain('string mood "mood"');
  });

  it("renders Mermaid ER text with nodes and edges", () => {
    const text = storeErSource(graph());
    expect(text.startsWith("erDiagram\n")).toBe(true);
    expect(text).toContain('    st_visit["NQL table: Visit"]');
    expect(text).toContain('    topic_demo_visit_topic ||--o{ st_visit : "feeds"');
  });
});
