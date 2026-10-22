import type { Mermaid } from "mermaid";

let ready: Promise<Mermaid> | undefined;

/** Mermaid is large, so it loads on first use. Pinned at 10.9.1: the hover handling relies on its element ids. */
export function getMermaid(): Promise<Mermaid> {
  ready ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "default",
      er: { useMaxWidth: false, layoutDirection: "LR" },
    });
    return mermaid;
  });
  return ready;
}

let seq = 0;
let queue: Promise<unknown> = Promise.resolve();

/** Renders one diagram at a time: Mermaid uses temporary page elements that concurrent renders would share. */
export function renderDiagram(source: string): Promise<string> {
  const id = `diagram-${++seq}`;
  const run = queue.then(async () => (await (await getMermaid()).render(id, source)).svg);
  queue = run.catch(() => undefined);
  return run;
}
