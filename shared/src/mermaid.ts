import type { ContextRec, StoreGraph, TableRec } from "./types";

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

const plain = (s: string) => s.replace(/[<>"&]/g, "");

/** The label of the context box: each context the table has, with the fields it offers. */
export function contextLabel(contexts: ContextRec[]): string {
  const lines = ["<b>Context</b>"];
  for (const c of contexts) {
    const fields = (names: string[]) => names.map(plain).join(", ");
    if (!c.composite) {
      const f = c.groups[0]?.fields ?? [];
      lines.push(`<b>${plain(c.name)}</b>${f.length ? `: ${fields(f)}` : ""}`);
    } else {
      lines.push(`<b>${plain(c.name)}</b>`);
      for (const g of c.groups) lines.push(`↳ ${plain(g.name)}${g.fields.length ? `: ${fields(g.fields)}` : ""}`);
    }
  }
  return lines.join("<br/>");
}

/** The diagram draws this many incoming relations; the rest are summarised in one box (the list shows all). */
export const MAX_INCOMING_IN_DIAGRAM = 12;

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

  let incomingDrawn = 0;
  let incomingSkipped = 0;
  t.relations.forEach((r, i) => {
    if (r.via === "context") return; // all contexts are one box, drawn last
    if (r.direction === "in" && ++incomingDrawn > MAX_INCOMING_IN_DIAGRAM) {
      incomingSkipped++;
      return;
    }
    const rt = r.target;
    const target = rt ? lookup(rt) : undefined;
    let id: string;
    let shape: "table" | "type" | "external";
    let label: string;
    if (rt && target) {
      id = nid(rt);
      shape = "table";
      // Other namespaces can have tables with the same title ("Event"), so say which one.
      label = rt.includes("::") ? `${titleOf(target)} (${rt.split("::")[0]})` : titleOf(target);
    } else if (rt) {
      id = nid(rt);
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
    else lines.push(`    ${center} -->|"${edge}"| ${id}`);
  });

  // One box for every context of the table. It is declared after the other outgoing boxes, so the layout
  // puts it at the right of them.
  if (t.contexts.length) {
    const ctx = nid("context");
    declare(ctx, contextLabel(t.contexts), "table");
    lines.push(`    ${center} -.->|"context"| ${ctx}`);
  }

  if (incomingSkipped > 0) {
    const more = nid("more_incoming");
    declare(more, `… and ${incomingSkipped} more ${incomingSkipped === 1 ? "table" : "tables"}`, "external");
    lines.push(`    ${more} -->|"see the list"| ${center}`);
  }

  lines.push("    classDef focus fill:#3b82f6,color:#fff,stroke:#1d4ed8");
  lines.push(`    class ${center} focus`);
  if (t.contexts.length) {
    lines.push("    classDef ctx fill:#f8fafc,stroke:#94a3b8,color:#1d2330,text-align:left");
    lines.push(`    class ${nid("context")} ctx`);
  }
  return lines.join("\n");
}
