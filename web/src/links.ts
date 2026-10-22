import type { NamespaceSummary } from "@dme/shared";

export type SummaryTable = NamespaceSummary["tables"][number];

export const tablePath = (ns: string, name: string) => `/${encodeURIComponent(ns)}/${encodeURIComponent(name)}`;

/** Finds the table a relation target ("key" or "namespace::key") points to. */
export function resolveTarget(summaries: NamespaceSummary[], currentNs: string, target: string | null) {
  if (!target) return null;
  const [nsName, key] = target.includes("::") ? target.split("::") : [currentNs, target];
  const ns = summaries.find((n) => n.name === nsName);
  const table = ns?.tables.find((t) => t.key === key);
  return ns && table ? { ns: ns.name, table } : null;
}

export function hrefForTarget(summaries: NamespaceSummary[], currentNs: string, target: string | null): string | null {
  const hit = resolveTarget(summaries, currentNs, target);
  return hit ? tablePath(hit.ns, hit.table.name) : null;
}
