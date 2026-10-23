/** API shapes shared by the server and the web app. */

export type TableKind = "timeseries" | "object" | "configObject" | "linkage" | "collection";

export interface FieldRec {
  name: string;
  type: string;
  label: string;
  description: string;
  platforms: string;
  role: "field" | "metric";
  jsonPath?: string;
}

export interface TypeRec {
  name: string;
  kind: string;
  description: string;
  fields: FieldRec[];
  structured: { name: string; typeName: string; target: string | null }[];
}

export interface StructuredRec {
  name: string;
  typeName: string;
  target: string | null;
  targetKind: string;
  description: string;
  label: string;
  /** True for JSON-array collections on an object. */
  collection?: boolean;
}

export interface Relation {
  direction: "out" | "in";
  via: "structured field" | "collection" | "object link" | "parent object" | "context";
  label: string;
  /** Table key in this namespace, "<namespace>::<key>" across namespaces, a type key, or null. */
  target: string | null;
  targetName: string;
  targetNs?: string;
  text: string;
}

export interface StoreTableRec {
  name: string;
  [attribute: string]: unknown;
}

export interface StoreColumn {
  storeName: string;
  dmRef: string;
  proto: string;
}

/** One group of a context, with the names of the fields it offers. */
export interface ContextGroup {
  name: string;
  fields: string[];
}

/** A context a table is enriched with (operating system, location, ...) and what it offers. */
export interface ContextRec {
  name: string;
  /** True when the context is made of several groups (for example the VDI client). */
  composite: boolean;
  groups: ContextGroup[];
}

export interface TableRec {
  key: string;
  kind: TableKind;
  name: string;
  collection: string;
  label: string;
  description: string;
  /** For a collection: the key of the object it is a JSON array on. */
  parent?: string;
  /** The contexts this table is enriched with; each table has its own set. */
  contexts: ContextRec[];
  meta: Record<string, string>;
  fields: FieldRec[];
  structured: StructuredRec[];
  relations: Relation[];
  store: { topic: string | null; tables: StoreTableRec[]; columns: StoreColumn[] };
}

export interface EnumRec {
  name: string;
  namespace: string;
  values: { label: string; value: string; description: string }[];
}

/** One box of the store (ClickHouse) overview diagram. */
export interface StoreEntity {
  id: string;
  title: string;
  attrs: string[];
}

export interface StoreRelation {
  from: string;
  to: string;
  label: string;
}

export interface StoreGraph {
  entities: StoreEntity[];
  relations: StoreRelation[];
}

export interface NamespaceDetail {
  name: string;
  /** The model folders the namespace was built from. */
  sources: string[];
  tables: TableRec[];
  types: Record<string, TypeRec>;
  enums: Record<string, EnumRec>;
  store: StoreGraph;
}

export interface NamespaceSummary {
  name: string;
  tables: { key: string; name: string; label: string; kind: TableKind; parent?: string }[];
  storeEntities: number;
  storeRelations: number;
}

export interface SearchHit {
  type: "table" | "field" | "enum";
  namespace: string;
  /** Table to open (for enums: the first table that uses the enum, if any). */
  tableKey: string | null;
  title: string;
  context: string;
  snippet: string;
}

export interface HealthInfo {
  ok: true;
  contentDir: string;
  fingerprint: string;
  builtAt: string;
  namespaces: number;
  tables: number;
}
