import type { NamespaceSummary, SearchHit } from "@dme/shared";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSearch } from "../api";
import { resolveTarget, tablePath } from "../links";

/** Global search. "/" focuses it from anywhere outside a text field; arrows and Enter pick a result. */
export function Search({ summaries }: { summaries: NamespaceSummary[] }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      fetchSearch(query).then((r) => {
        if (current) {
          setHits(r);
          setSelected(0);
        }
      }, () => current && setHits([]));
    }, 120);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query]);

  const hrefFor = (hit: SearchHit): string => {
    const found = hit.tableKey && resolveTarget(summaries, hit.namespace, hit.tableKey);
    return found ? tablePath(found.ns, found.table.name) : `/${encodeURIComponent(hit.namespace)}`;
  };

  const go = (hit: SearchHit) => {
    navigate(hrefFor(hit));
    setOpen(false);
    setQuery("");
    input.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      input.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && hits[selected]) {
      go(hits[selected]);
    }
  };

  const showResults = open && query.trim().length >= 2;
  return (
    <div className="search" role="search">
      <input
        ref={input}
        type="search"
        placeholder="Search  ( / )"
        aria-label="Search the data model"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {showResults && (
        <div className="results" role="listbox">
          {hits.length === 0 && <div className="empty">No matches</div>}
          {hits.map((hit, i) => (
            <a
              key={`${hit.type}|${hit.namespace}|${hit.tableKey}|${hit.title}`}
              className="result"
              role="option"
              aria-selected={i === selected}
              href={hrefFor(hit)}
              onMouseDown={(e) => { e.preventDefault(); go(hit); }}
            >
              <span className="kind">{hit.type}</span>{hit.title}
              <small>{hit.context}{hit.snippet ? ` — ${hit.snippet}` : ""}</small>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
