import { titleOf, type NamespaceDetail, type NamespaceSummary, type TableRec, type TypeRec } from "@dme/shared";
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { NotFound } from "../App";
import { fetchNamespace } from "../api";
import { RelationDiagram } from "../components/RelationDiagram";
import { useDocumentTitle, useLoad } from "../hooks";
import { hrefForTarget } from "../links";

type Filter = null | "fields" | "metrics" | "structured" | "relations" | "storage";

const FILTER_LABELS: Record<Exclude<Filter, null>, string> = {
  fields: "fields", metrics: "metrics", structured: "structured fields",
  relations: "relationships", storage: "ClickHouse tables",
};
const KIND_LABELS: Record<TableRec["kind"], string> = {
  timeseries: "Timeseries", object: "Object", configObject: "Config object", linkage: "Linkage",
};

const dash = (s: ReactNode) => (s === undefined || s === null || s === "" ? <span className="muted">—</span> : s);

export function TablePage({ summaries }: { summaries: NamespaceSummary[] }) {
  const { ns = "", table = "" } = useParams();
  const summary = summaries.find((s) => s.name === ns)?.tables.find((t) => t.name === table);
  useDocumentTitle(summary ? `${titleOf(summary)} · ${ns}` : "Not found");
  if (!summaries.some((s) => s.name === ns)) return <NotFound what={`The namespace '${ns}'`} />;
  if (!summary) return <NotFound what={`The table '${table}' in ${ns}`} />;
  return <Loaded key={`${ns}/${summary.key}`} ns={ns} tableKey={summary.key} summaries={summaries} />;
}

function Loaded({ ns, tableKey, summaries }: { ns: string; tableKey: string; summaries: NamespaceSummary[] }) {
  const detail = useLoad<NamespaceDetail>(() => fetchNamespace(ns), ns);
  if (detail.status === "loading") return <p className="muted">Loading…</p>;
  if (detail.status === "error") return <p className="err">{detail.message}</p>;
  const table = detail.value.tables.find((t) => t.key === tableKey);
  if (!table) return <NotFound what="This table" />;
  return <TableView ns={ns} table={table} detail={detail.value} summaries={summaries} />;
}

function TableView({ ns, table: t, detail, summaries }: { ns: string; table: TableRec; detail: NamespaceDetail; summaries: NamespaceSummary[] }) {
  const [filter, setFilter] = useState<Filter>(null);
  const shows = (cat: Exclude<Filter, null>) => filter === null || filter === cat;

  const metricCount = t.fields.filter((f) => f.role === "metric").length;
  const fieldCount = t.fields.length - metricCount;
  const fieldRows = t.fields.filter((f) => (filter === "fields" ? f.role === "field" : filter === "metrics" ? f.role === "metric" : true));

  const link = (target: string | null, text: string) => {
    const href = hrefForTarget(summaries, ns, target);
    return href ? <Link className="link" to={href}>{text}</Link> : <code>{text}</code>;
  };

  const metaParts: ReactNode[] = [];
  if (t.meta.timestampField) metaParts.push(<>timestamp: <code>{t.meta.timestampField}</code></>);
  if (t.meta.entityField) metaParts.push(<>entity: <code>{t.meta.entityField}</code></>);
  if (t.meta.identifier) metaParts.push(<>identifier: <code>{t.meta.identifier}</code></>);
  if (t.meta.cardinalityMetric) metaParts.push(<>cardinality metric: <code>{t.meta.cardinalityMetric}</code></>);
  if (t.meta.lastSeen) metaParts.push(<>last seen: <code>{t.meta.lastSeen}</code></>);

  const enumNames = [...new Set(t.fields.filter((f) => f.type.startsWith("enumeration/")).map((f) => f.type))];

  const card = (cat: Exclude<Filter, null>, n: number, label: string) => (
    <button className="stat" aria-pressed={filter === cat} title={`Show only ${label}`}
            onClick={() => setFilter((cur) => (cur === cat ? null : cat))}>
      <b>{n}</b><span>{label}</span>
    </button>
  );

  return (
    <>
      <h1>{titleOf(t)}</h1>
      <p className="sub">
        {KIND_LABELS[t.kind]} · table <code>{t.name}</code> · collection <code>{t.collection}</code>
        {metaParts.map((m, i) => <span key={i}> · {m}</span>)}
      </p>
      <p>{t.description || <span className="muted">No description in the model.</span>}</p>

      <div className="stats">
        {card("fields", fieldCount, "fields")}
        {card("metrics", metricCount, "metrics")}
        {card("structured", t.structured.length, "structured fields")}
        {card("relations", t.relations.length, "relations")}
        {card("storage", t.store.tables.length, "ClickHouse tables")}
      </div>
      {filter && (
        <div className="filter-banner">
          <span>Showing only <b>{FILTER_LABELS[filter]}</b></span>
          <button className="btn" onClick={() => setFilter(null)}>Clear filter</button>
        </div>
      )}

      {(filter === null || filter === "fields" || filter === "metrics") && (
        <>
          <h2 className="sec">{filter === "metrics" ? "Metrics" : "Fields"}</h2>
          <div className="tblwrap">
            <table className="fields">
              <thead><tr><th>Name</th><th>Label</th><th>Type</th><th>Platforms</th><th>Description</th></tr></thead>
              <tbody>
                {fieldRows.length === 0 && <tr><td colSpan={5} className="muted">None in this category</td></tr>}
                {fieldRows.map((f) => (
                  <tr key={`${f.role}:${f.name}`}>
                    <td><code>{f.name}</code>{f.role === "metric" && <span className="badge">metric</span>}</td>
                    <td>{dash(f.label)}</td>
                    <td className="type"><code>{f.type}</code></td>
                    <td>{dash(f.platforms)}</td>
                    <td className="desc">{dash(f.description)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {shows("structured") && t.structured.length > 0 && (
        <>
          <h2 className="sec">Structured fields</h2>
          <ul className="rel">
            {t.structured.map((s) => (
              <li key={s.name}>
                <code>{s.name}</code> → {s.typeName}{" "}
                <span className="muted">({s.collection ? "JSON array of " : ""}{s.targetKind})</span>
                {s.description && <> — {s.description}</>}
                {s.target && detail.types[s.target] && <TypeDetails type={detail.types[s.target]} label={s.typeName} />}
              </li>
            ))}
          </ul>
        </>
      )}
      {filter === "structured" && t.structured.length === 0 && <p className="muted">No structured fields.</p>}

      {shows("relations") && (
        <>
          <h2 className="sec">Relationships</h2>
          {t.relations.length === 0 ? <p className="muted">No relationships.</p> : (
            <>
              <RelationDiagram table={t} ns={ns} summaries={summaries} />
              <details>
                <summary>As list ({t.relations.length})</summary>
                <ul className="rel">
                  {t.relations.map((r, i) => (
                    <li key={i}>
                      <span className="arrow">{r.direction === "in" ? "←" : "→"}</span>
                      {link(r.target, r.targetName)}
                      <span className="via">{r.via}</span>
                      <div className="muted">{r.text}</div>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </>
      )}

      {(filter === null || filter === "fields") && enumNames.length > 0 && (
        <>
          <h2 className="sec">Enums used</h2>
          {enumNames.map((tn) => <EnumDetails key={tn} typeName={tn} detail={detail} />)}
        </>
      )}

      {shows("storage") && (
        <>
          <h2 className="sec">Storage (ClickHouse)</h2>
          <p>
            {t.store.topic
              ? <>Kafka topic: <code>{t.store.topic}</code></>
              : <span className="muted">No feed declared: the store model has no Kafka topic for this table.</span>}
          </p>
          {t.store.tables.length > 0 && (
            <div className="tblwrap">
              <table className="fields">
                <thead><tr><th>Table</th><th>Time resolution</th><th>Storage type</th><th>TTL (days)</th></tr></thead>
                <tbody>
                  {t.store.tables.map((tb) => (
                    <tr key={tb.name}>
                      <td><code>{tb.name}</code></td>
                      <td>{dash(tb.timeResolution as string)}</td>
                      <td>{dash(tb.storageType as string)}</td>
                      <td>{dash(tb.ttlInDays as number)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {t.store.columns.length > 0 && (
            <details>
              <summary>Column mappings ({t.store.columns.length})</summary>
              <div className="tblwrap">
                <table className="fields">
                  <thead><tr><th>Column</th><th>NQL field</th><th>Proto path</th></tr></thead>
                  <tbody>
                    {t.store.columns.map((c, i) => (
                      <tr key={i}><td><code>{c.storeName}</code></td><td>{dash(c.dmRef)}</td><td>{dash(c.proto)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
    </>
  );
}

function TypeDetails({ type, label }: { type: TypeRec; label: string }) {
  return (
    <details>
      <summary>{label} fields ({type.fields.length})</summary>
      <ul>
        {type.fields.map((f) => (
          <li key={`${f.role}:${f.name}`}>
            <code>{f.name}</code>{f.role === "metric" && <span className="badge">metric</span>}{" "}
            <span className="muted">
              {f.type}{f.jsonPath && <> · JSON path <code>{f.jsonPath}</code></>}
            </span>
            {f.description && <> — {f.description}</>}
          </li>
        ))}
        {type.structured.map((s) => <li key={`nested:${s.name}`}>nested <code>{s.name}</code> → {s.typeName}</li>)}
      </ul>
    </details>
  );
}

function EnumDetails({ typeName, detail }: { typeName: string; detail: NamespaceDetail }) {
  const e = detail.enums[typeName.replace("enumeration/", "")];
  if (!e || e.values.length === 0) {
    return <details><summary><code>{typeName}</code></summary><p className="muted">No values in the model.</p></details>;
  }
  return (
    <details>
      <summary><code>{typeName}</code> ({e.values.length} values)</summary>
      <ul>
        {e.values.map((v) => (
          <li key={v.label}><code>{v.label}</code> = {v.value}{v.description && <> — {v.description}</>}</li>
        ))}
      </ul>
    </details>
  );
}
