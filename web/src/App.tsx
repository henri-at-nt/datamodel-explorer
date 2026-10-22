import type { NamespaceSummary } from "@dme/shared";
import { Link, Route, Routes } from "react-router-dom";
import { fetchNamespaces } from "./api";
import { useDocumentTitle, useLoad } from "./hooks";
import { Home } from "./pages/Home";
import { NamespacePage } from "./pages/NamespacePage";
import { TablePage } from "./pages/TablePage";
import { Nav } from "./components/Nav";

export function NotFound({ what }: { what?: string }) {
  useDocumentTitle("Not found");
  return (
    <>
      <h1>Not found</h1>
      <p>{what ? `${what} does not exist in the model.` : "There is nothing at this address."}</p>
      <p><Link className="link" to="/">Back to the start</Link></p>
    </>
  );
}

export function App() {
  const summaries = useLoad<NamespaceSummary[]>(fetchNamespaces, "namespaces");
  if (summaries.status === "loading") return <main><p className="muted">Loading the model…</p></main>;
  if (summaries.status === "error") {
    return <main><h1>The model could not be loaded</h1><p className="err">{summaries.message}</p></main>;
  }
  const list = summaries.value;
  return (
    <>
      <Nav summaries={list} />
      <main>
        <Routes>
          <Route path="/" element={<Home summaries={list} />} />
          <Route path="/:ns" element={<NamespacePage summaries={list} />} />
          <Route path="/:ns/:table" element={<TablePage summaries={list} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
