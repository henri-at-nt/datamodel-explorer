import { useEffect, useState } from "react";

export type Loadable<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; value: T };

/** Runs an async loader whenever its key changes; late results of an earlier key are ignored. */
export function useLoad<T>(load: () => Promise<T>, key: string): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ status: "loading" });
  useEffect(() => {
    let current = true;
    setState({ status: "loading" });
    load().then(
      (value) => current && setState({ status: "ready", value }),
      (e: unknown) => current && setState({ status: "error", message: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · NQL data model` : "NQL data model";
  }, [title]);
}
