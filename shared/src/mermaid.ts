import type { StoreGraph, TableRec } from "./types";

const quote = (s: unknown) => String(s ?? "").replace(/"/g, "'");

/** Display title: the model label, or a humanised name when the label is just the technical name. */
export function titleOf(t: Pick<TableRec, "name" | "label">): string {
  if (t.label && t.label !== t.name) return t.label;
  const words = t.name.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Mermaid erDiagram for the store overview: nodes and edges only (columns go to the hover popup). */
export function storeErSource(store: StoreGraph): string {
  const out = ["erDiagram"];
  for (const e of store.entities) out.push(`    ${e.id}["${quote(e.title)}"]`);
  for (const r of store.relations) out.push(`    ${r.from} ||--o{ ${r.to} : "${quote(r.label)}"`);
  return out.join("\n");
}

/**
 * Mermaid flowchart (top to bottom) of one table and everything it relates to.
 * `lookup` resolves a relation target ("key" or "namespace::key") to a table, when it is one.
 */
export function relationFlowSource(
  t: TableRec,
  lookup: (key: string) => Pick<TableRec, "name" | "label"> | undefined,
): string {
  const nid = (s: string) => "n_" + String(s).replace(/[^A-Za-z0-9]/g, "_");
  const lines = ["flowchart TB"];
  const declared = new Set<string>();
  const declare = (id: string, label: string, shape: "table" | "type" | "external") => {
    if (declared.has(id)) return;
    declared.add(id);
    const body = `"${quote(label)}"`;
    lines.push(shape === "type" ? `    ${id}(${body})` : shape === "external" ? `    ${id}([${body}])` : `    ${id}[${body}]`);
  };

  const center = nid(t.key);
  declare(center, titleOf(t), "table");

  t.relations.forEach((r, i) => {
    const target = r.target ? lookup(r.target) : undefined;
    let id: string;
    let shape: "table" | "type" | "external";
    let label: string;
    if (target) {
      id = nid(r.target as string);
      shape = "table";
      label = titleOf(target);
    } else if (r.target) {
      id = nid(r.target);
      shape = "type";
      label = r.targetName;
    } else {
      id = nid(`ext_${i}_${r.targetName}`);
      shape = "external";
      label = r.targetName;
    }
    declare(id, label, shape);

    const edge = quote(r.via === "structured field" || r.via === "collection" ? r.label : r.via);
    if (r.direction === "in") lines.push(`    ${id} -->|"${edge}"| ${center}`);
    else if (r.via === "context") lines.push(`    ${center} -.->|"${edge}"| ${id}`);
    else lines.push(`    ${center} -->|"${edge}"| ${id}`);
  });

  lines.push("    classDef focus fill:#3b82f6,color:#fff,stroke:#1d4ed8");
  lines.push(`    class ${center} focus`);
  return lines.join("\n");
}
