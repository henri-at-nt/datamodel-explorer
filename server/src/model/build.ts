import type { NamespaceDetail, NamespaceSummary, SearchHit, TableRec } from "@dme/shared";
import { buildStoreGraph } from "./store";
import { buildTables } from "./tables";
import type { Raw, RawNamespace } from "./raw";

export interface Model {
  namespaces: NamespaceDetail[];
  summaries: NamespaceSummary[];
  byName: Map<string, NamespaceDetail>;
  search: (query: string, limit?: number) => SearchHit[];
}

/** Builds every namespace, then resolves object links that point into other namespaces. */
export function buildModel(raw: RawNamespace[]): Model {
  const enumFiles = new Map<string, Map<string, Raw>>(
    raw.map((r) => [r.name, new Map<string, Raw>((r.dm.enumDataTypes ?? []).map((e: Raw) => [e.name, e]))]),
  );
  const enumDef = (ns: string, name: string) => enumFiles.get(ns)?.get(name);

  const namespaces: NamespaceDetail[] = raw
    .map((r) => ({
      name: r.name,
      ...buildTables(r.name, r.dm, r.sm, enumDef),
      store: buildStoreGraph(r.dm, r.sm),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const byName = new Map(namespaces.map((n) => [n.name, n]));

  // Object links to another namespace become "<namespace>::<key>" so the app can open that page.
  for (const ns of namespaces) {
    for (const t of ns.tables) {
      for (const r of t.relations) {
        const other = byName.get(r.targetNs ?? ns.name);
        if (r.target || !other || other === ns) continue;
        const hit = other.tables.find(
          (x) => x.name === r.targetName && (x.kind === "object" || x.kind === "configObject"),
        );
        if (hit) r.target = `${other.name}::${hit.key}`;
      }
    }
  }

  const summaries: NamespaceSummary[] = namespaces.map((n) => ({
    name: n.name,
    tables: n.tables.map((t) => ({ key: t.key, name: t.name, label: t.label, kind: t.kind, ...(t.parent ? { parent: t.parent } : {}) })),
    storeEntities: n.store.entities.length,
    storeRelations: n.store.relations.length,
  }));

  return { namespaces, summaries, byName, search: makeSearch(namespaces) };
}

interface Entry {
  hit: SearchHit;
  name: string;
  label: string;
  description: string;
}

/** In-memory search over tables, fields and enums; the model is small enough for a linear scan. */
function makeSearch(namespaces: NamespaceDetail[]): Model["search"] {
  const entries: Entry[] = [];
  const firstTableUsingEnum = new Map<string, TableRec>();

  for (const ns of namespaces) {
    for (const t of ns.tables) {
      entries.push({
        hit: { type: "table", namespace: ns.name, tableKey: t.key, title: t.label || t.name, context: `${ns.name} · ${t.kind}`, snippet: t.description },
        name: t.name, label: t.label, description: t.description,
      });
      for (const f of t.fields) {
        entries.push({
          hit: { type: "field", namespace: ns.name, tableKey: t.key, title: f.name, context: `${ns.name} · ${t.label || t.name}`, snippet: f.description },
          name: f.name, label: f.label, description: f.description,
        });
        if (f.type.startsWith("enumeration/")) {
          const id = f.type.replace("enumeration/", "");
          if (!firstTableUsingEnum.has(id)) firstTableUsingEnum.set(id, t);
        }
      }
    }
  }
  for (const ns of namespaces) {
    for (const [id, e] of Object.entries(ns.enums)) {
      const user = firstTableUsingEnum.get(id);
      const values = e.values.map((v) => `${v.label} ${v.value}`).join(" ");
      entries.push({
        hit: {
          type: "enum", namespace: user ? ns.name : e.namespace, tableKey: user?.key ?? null, title: e.name,
          context: `enum ${id}`, snippet: e.values.map((v) => v.label).slice(0, 8).join(", "),
        },
        name: e.name, label: values, description: "",
      });
    }
  }

  const seen = new Set<string>();
  const unique = entries.filter((e) => {
    const key = `${e.hit.type}|${e.hit.namespace}|${e.hit.tableKey}|${e.hit.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const score = (e: Entry, q: string): number => {
    const name = e.name.toLowerCase();
    const label = e.label.toLowerCase();
    if (name === q || label === q) return 100;
    if (name.startsWith(q) || label.startsWith(q)) return 80;
    if (name.includes(q) || label.includes(q)) return 60;
    if (e.description.toLowerCase().includes(q)) return 20;
    return 0;
  };
  const typeRank = { table: 3, field: 2, enum: 1 };

  return (query, limit = 50) => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return unique
      .map((e) => ({ e, s: score(e, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || typeRank[b.e.hit.type] - typeRank[a.e.hit.type] || a.e.hit.title.localeCompare(b.e.hit.title))
      .slice(0, limit)
      .map((x) => x.e.hit);
  };
}
