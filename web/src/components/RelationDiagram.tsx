import { relationFlowSource, type NamespaceSummary, type TableRec } from "@dme/shared";
import { useEffect, useRef, useState } from "react";
import { resolveTarget } from "../links";
import { renderDiagram } from "../mermaid";

/** What one table relates to, as a small top-to-bottom flowchart. */
export function RelationDiagram({ table, ns, summaries }: { table: TableRec; ns: string; summaries: NamespaceSummary[] }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let current = true;
    setError(null);
    setRendered(false);
    const source = relationFlowSource(table, (key) => resolveTarget(summaries, ns, key)?.table);
    renderDiagram(source).then(
      (svg) => {
        if (!current || !host.current) return;
        host.current.innerHTML = svg;
        setRendered(true);
      },
      (e: unknown) => current && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => { current = false; };
  }, [table, ns, summaries]);

  return (
    <div className="reldiagram">
      {error && <p className="err">Diagram failed to render: {error}</p>}
      {!error && !rendered && <p className="muted">Drawing…</p>}
      <div ref={host} />
    </div>
  );
}
