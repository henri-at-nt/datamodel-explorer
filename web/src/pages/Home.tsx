import type { NamespaceSummary } from "@dme/shared";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks";

export function Home({ summaries }: { summaries: NamespaceSummary[] }) {
  useDocumentTitle("");
  const tables = summaries.reduce((n, s) => n + s.tables.length, 0);
  return (
    <>
      <h1>NQL data model</h1>
      <p className="sub">{summaries.length} namespaces, {tables} tables. Pick a namespace, or press <code>/</code> to search.</p>
      <div className="ns-grid">
        {summaries.map((ns) => (
          <Link key={ns.name} to={`/${encodeURIComponent(ns.name)}`}>
            <b>{ns.name}</b>
            <span className="muted">{ns.tables.length} {ns.tables.length === 1 ? "table" : "tables"}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
