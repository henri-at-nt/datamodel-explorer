import type { NamespaceDetail, NamespaceSummary, SearchHit } from "@dme/shared";

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      message = (await res.json()).error ?? message;
    } catch {
      /* body was not JSON */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const fetchNamespaces = () => get<NamespaceSummary[]>("/api/namespaces");
export const fetchSearch = (q: string) => get<SearchHit[]>(`/api/search?q=${encodeURIComponent(q)}`);

const details = new Map<string, Promise<NamespaceDetail>>();

/** Namespace details are fetched once per page load and kept; a reload of the page picks up a refreshed model. */
export function fetchNamespace(name: string): Promise<NamespaceDetail> {
  let p = details.get(name);
  if (!p) {
    p = get<NamespaceDetail>(`/api/namespaces/${encodeURIComponent(name)}`);
    p.catch(() => details.delete(name));
    details.set(name, p);
  }
  return p;
}
