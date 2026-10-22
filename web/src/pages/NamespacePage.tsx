import type { NamespaceDetail, NamespaceSummary } from "@dme/shared";
import { useParams } from "react-router-dom";
import { NotFound } from "../App";
import { fetchNamespace } from "../api";
import { StoreDiagram } from "../components/StoreDiagram";
import { useDocumentTitle, useLoad } from "../hooks";

export function NamespacePage({ summaries }: { summaries: NamespaceSummary[] }) {
  const { ns = "" } = useParams();
  useDocumentTitle(ns);
  const known = summaries.some((s) => s.name === ns);
  if (!known) return <NotFound what={`The namespace '${ns}'`} />;
  return <Overview key={ns} ns={ns} />;
}

function Overview({ ns }: { ns: string }) {
  const detail = useLoad<NamespaceDetail>(() => fetchNamespace(ns), ns);
  return (
    <>
      <h1>{ns} namespace</h1>
      <p className="sub">Source: data-platform.data-model-content / content/feature/{ns}</p>
      {detail.status === "loading" && <p className="muted">Loading…</p>}
      {detail.status === "error" && <p className="err">{detail.message}</p>}
      {detail.status === "ready" && <OverviewBody detail={detail.value} />}
    </>
  );
}

function OverviewBody({ detail }: { detail: NamespaceDetail }) {
  const { entities, relations } = detail.store;
  if (entities.length === 0) return <p className="muted">No storage mappings in this namespace.</p>;
  return (
    <>
      <div className="stats">
        <div className="stat"><b>{entities.length}</b><span>entities</span></div>
        <div className="stat"><b>{relations.length}</b><span>links</span></div>
      </div>
      <StoreDiagram store={detail.store} />
      <div className="card">
        <h3>How to read it</h3>
        <ul>
          <li><b>Boxes</b> are Kafka topics, timeseries/objects and ClickHouse tables.</li>
          <li><b>Lines</b> show the pipeline: <code>feeds</code> (topic to table) and <code>stored in</code> (table to ClickHouse table).</li>
          <li><b>Hover a box</b> to see its columns. Each column reads <code>storeName</code>, then <code>dmName &lt;- protobuf path</code> in the comment.</li>
          <li><b>Zoom:</b> use the buttons, or Ctrl/Cmd + scroll over the diagram.</li>
          <li>Only feeds declared in the store model are drawn; a table without a topic has no feed line.</li>
        </ul>
      </div>
    </>
  );
}
