import { titleOf, type NamespaceSummary } from "@dme/shared";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { tablePath } from "../links";
import { Search } from "./Search";

/** Namespaces are a collapsible first level; their tables sit underneath as the second level. */
export function Nav({ summaries }: { summaries: NamespaceSummary[] }) {
  const { pathname } = useLocation();
  const [, routeNs, routeTable] = pathname.split("/").map((s) => decodeURIComponent(s));
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(summaries[0] ? [summaries[0].name] : []));

  // Opening a page in a namespace expands that namespace.
  useEffect(() => {
    if (routeNs) setExpanded((prev) => (prev.has(routeNs) ? prev : new Set(prev).add(routeNs)));
  }, [routeNs]);

  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  return (
    <nav aria-label="Namespaces and tables">
      <Link className="nav-link home" to="/">NQL data model</Link>
      <Search summaries={summaries} />
      <h2>Namespaces</h2>
      {summaries.map((ns) => {
        const open = expanded.has(ns.name);
        return (
          <div key={ns.name}>
            <div className="ns-row">
              <button
                className="caret"
                aria-label={`${open ? "Collapse" : "Expand"} ${ns.name}`}
                aria-expanded={open}
                onClick={() => toggle(ns.name)}
              >
                {open ? "▾" : "▸"}
              </button>
              <Link
                className="nav-link ns"
                to={`/${encodeURIComponent(ns.name)}`}
                aria-current={routeNs === ns.name && !routeTable ? "page" : undefined}
              >
                {ns.name}
              </Link>
            </div>
            {open && ns.tables.length > 0 && (
              <div className="tbl-list">
                {ns.tables.map((t) => (
                  <Link
                    key={t.key}
                    className="nav-link"
                    to={tablePath(ns.name, t.name)}
                    aria-current={routeNs === ns.name && routeTable === t.name ? "page" : undefined}
                  >
                    {titleOf(t)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
