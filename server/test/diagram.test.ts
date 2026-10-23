import { MAX_INCOMING_IN_DIAGRAM, relationFlowSource, type Relation, type TableRec } from "@dme/shared";
import { describe, expect, it } from "vitest";

const incoming = (n: number): Relation[] =>
  Array.from({ length: n }, (_, i) => ({
    direction: "in" as const, via: "object link" as const, label: `t${i}`, target: `ts_t${i}`, targetName: `t${i}`, text: "",
  }));

const table = (relations: Relation[]): TableRec => ({
  key: "obj_hub", kind: "object", name: "hub", collection: "hubs", label: "Hub", description: "",
  meta: {}, fields: [], structured: [], relations, store: { topic: null, tables: [], columns: [] },
});

const source = (n: number) => relationFlowSource(table(incoming(n)), () => undefined);
const edges = (text: string) => text.split("\n").filter((l) => l.includes("-->|"));

describe("relation diagram", () => {
  it("draws every incoming relation up to the limit", () => {
    expect(MAX_INCOMING_IN_DIAGRAM).toBe(12);
    expect(edges(source(12))).toHaveLength(12);
    expect(source(12)).not.toContain("more");
  });

  it("summarises the rest in one box when there are more than the limit", () => {
    const text = source(15);
    expect(edges(text)).toHaveLength(13); // twelve drawn plus the summary edge
    expect(text).toContain("… and 3 more tables");
  });

  it("uses the singular for one more table", () => {
    expect(source(13)).toContain("… and 1 more table\"");
  });

  it("names the namespace of related tables in other namespaces, and only those", () => {
    const rel = (target: string): Relation => ({ direction: "out", via: "object link", label: "x", target, targetName: "event", text: "" });
    const lookup = () => ({ name: "event", label: "Event" });
    const text = relationFlowSource(table([rel("web::ts_event"), rel("execution::ts_event"), rel("ts_event")]), lookup);
    expect(text).toContain('"Event (web)"');
    expect(text).toContain('"Event (execution)"');
    expect(text).toMatch(/\["Event"\]/); // same namespace: title alone
  });

  it("does not cap outgoing relations", () => {
    const out: Relation[] = Array.from({ length: 20 }, (_, i) => ({
      direction: "out", via: "structured field", label: `f${i}`, target: null, targetName: `f${i}`, text: "",
    }));
    expect(edges(relationFlowSource(table(out), () => undefined))).toHaveLength(20);
  });
});
