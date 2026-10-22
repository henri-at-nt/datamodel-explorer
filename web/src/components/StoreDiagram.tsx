import { storeErSource, type StoreGraph } from "@dme/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderDiagram } from "../mermaid";

const ZOOM_MIN = 0.1, ZOOM_MAX = 3, ZOOM_STEP = 1.25;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

interface PopupState { title: string; attrs: string[]; x: number; y: number }

/** The store (ClickHouse) overview: an ER diagram with hover details and zoom. */
export function StoreDiagram({ store }: { store: StoreGraph }) {
  const source = useMemo(() => storeErSource(store), [store]);
  const frame = useRef<HTMLDivElement>(null); // scrollable box, managed by React
  const host = useRef<HTMLDivElement>(null); // holds the SVG; React never renders children into it
  const base = useRef<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const applyZoom = useCallback((z: number) => {
    const svg = host.current?.querySelector("svg");
    if (svg && base.current) {
      svg.style.width = base.current.w * z + "px";
      svg.style.height = base.current.h * z + "px";
    }
  }, []);

  useEffect(() => {
    let current = true;
    setError(null);
    setRendered(false);
    renderDiagram(source).then(
      (svg) => {
        const el = host.current;
        if (!current || !el) return;
        el.innerHTML = svg;
        const svgEl = el.querySelector("svg")!;
        const box = svgEl.getBoundingClientRect();
        base.current = { w: box.width, h: box.height };
        svgEl.removeAttribute("style");
        svgEl.setAttribute("width", String(box.width));
        svgEl.setAttribute("height", String(box.height));
        attachHover(svgEl);
        setZoom(1);
        applyZoom(1);
        setRendered(true);
      },
      (e: unknown) => current && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => { current = false; };

    function attachHover(svg: SVGElement) {
      const byKey = new Map(store.entities.map((e) => [norm(e.id), e]));
      svg.querySelectorAll<SVGGElement>('g[id^="entity-"]').forEach((g) => {
        // Mermaid ids look like entity-<id without underscores>-<n>.
        const m = g.id.match(/^entity-([a-z0-9]+)-/i);
        const info = m && byKey.get(m[1].toLowerCase());
        if (!info) return;
        const show = (ev: MouseEvent) => setPopup({ title: info.title, attrs: info.attrs, x: ev.clientX, y: ev.clientY });
        g.addEventListener("mouseenter", show);
        g.addEventListener("mousemove", show);
        g.addEventListener("mouseleave", () => setPopup(null));
      });
    }
  }, [source, store, applyZoom]);

  useEffect(() => applyZoom(zoom), [zoom, applyZoom]);

  // Ctrl/Cmd + wheel zooms the diagram instead of the page.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      if (!ev.ctrlKey && !ev.metaKey) return;
      ev.preventDefault();
      setZoom((z) => clamp(ev.deltaY < 0 ? z * 1.1 : z / 1.1));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const clamp = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
  const fit = () => {
    if (frame.current && base.current) setZoom(clamp(Math.min(1, (frame.current.clientWidth - 24) / base.current.w)));
  };

  return (
    <>
      <div className="row">
        <span className="muted">Store (ClickHouse)</span>
        <div className="zoom" aria-label="Zoom">
          <button className="btn" title="Zoom out" onClick={() => setZoom((z) => clamp(z / ZOOM_STEP))}>−</button>
          <output>{Math.round(zoom * 100)}%</output>
          <button className="btn" title="Zoom in" onClick={() => setZoom((z) => clamp(z * ZOOM_STEP))}>+</button>
          <button className="btn" title="Fit to width" onClick={fit}>Fit</button>
          <button className="btn" title="Actual size" onClick={() => setZoom(1)}>100%</button>
        </div>
      </div>
      <div className="diagram" ref={frame}>
        {!rendered && !error && <p className="muted">Rendering…</p>}
        <div ref={host} />
      </div>
      {error && <p className="err">Diagram failed to render: {error}</p>}
      {popup && <Popup {...popup} />}
      <details>
        <summary>Mermaid source</summary>
        <pre>{source}</pre>
      </details>
    </>
  );
}

function Popup({ title, attrs, x, y }: PopupState) {
  const el = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + 14, top: y + 14 });
  useEffect(() => {
    const w = el.current?.offsetWidth ?? 0, h = el.current?.offsetHeight ?? 0;
    let left = x + 14, top = y + 14;
    if (left + w > window.innerWidth) left = x - w - 14;
    if (top + h > window.innerHeight) top = Math.max(8, window.innerHeight - h - 8);
    setPos({ left, top });
  }, [x, y, title]);
  return (
    <div className="popup" ref={el} style={pos}>
      <h4>{title}</h4>
      {attrs.length ? <ul>{attrs.map((a, i) => <li key={i}>{a}</li>)}</ul> : <p className="more">No attributes</p>}
    </div>
  );
}
