import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** The model JSON is large and loosely typed; the generators read it defensively. */
export type Raw = Record<string, any>;

export interface RawNamespace {
  name: string;
  /** The model folders this namespace was built from (more than one when a namespace is split across folders). */
  sources: string[];
  /** nql-data-model.json: the product-facing tables, fields and enums. */
  dm: Raw;
  /** nql-store-model.json: the binding to Kafka topics and ClickHouse tables. */
  sm: Raw;
}

export interface RawModel {
  namespaces: RawNamespace[];
  /** The shared context definitions (content/common), when present. */
  context?: Raw;
}

const DATA_MODEL = "nql-data-model.json";
const STORE_MODEL = "nql-store-model.json";

/** Sorted absolute paths of every model file under <contentDir>/feature/<namespace>/. */
export function listModelFiles(contentDir: string): string[] {
  const feature = join(contentDir, "feature");
  if (!existsSync(feature)) return [];
  const files: string[] = [];
  for (const ns of readdirSync(feature).sort()) {
    const dir = join(feature, ns);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of [DATA_MODEL, STORE_MODEL]) {
      const path = join(dir, f);
      if (existsSync(path)) files.push(path);
    }
  }
  const common = join(contentDir, "common", DATA_MODEL);
  if (existsSync(common)) files.push(common);
  return files;
}

/** Content hash of the model files: changes on pulls, branch switches and local edits alike. */
export function fingerprintFiles(files: string[]): string {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file);
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const readNamespace = (path: string): Raw => JSON.parse(readFileSync(path, "utf-8")).namespaces[0] ?? {};

/** Joins the parts of one namespace: lists are concatenated, other values come from the first part that has them. */
function mergeParts(parts: Raw[]): Raw {
  const merged: Raw = {};
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      if (Array.isArray(value)) merged[key] = [...(merged[key] ?? []), ...value];
      else if (!(key in merged)) merged[key] = value;
    }
  }
  return merged;
}

export function loadRaw(contentDir: string): RawModel {
  const feature = join(contentDir, "feature");

  // A namespace is the name declared inside the files, not the folder name: a few folders add tables to
  // another folder's namespace. Folders that declare the same name are one namespace.
  const folders = new Map<string, { folder: string; dm: Raw; sm: Raw }[]>();
  for (const folder of readdirSync(feature).sort()) {
    const dmPath = join(feature, folder, DATA_MODEL);
    if (!existsSync(dmPath)) continue;
    const dm = readNamespace(dmPath);
    const smPath = join(feature, folder, STORE_MODEL);
    const name: string = dm.name || folder;
    if (!folders.has(name)) folders.set(name, []);
    folders.get(name)!.push({ folder, dm, sm: existsSync(smPath) ? readNamespace(smPath) : {} });
  }

  const out: RawNamespace[] = [...folders].map(([name, parts]) => {
    // The folder named like the namespace comes first: it holds the description and most of the content.
    parts.sort((a, b) => Number(b.folder === name) - Number(a.folder === name));
    return {
      name,
      sources: parts.map((p) => p.folder),
      dm: mergeParts(parts.map((p) => p.dm)),
      sm: mergeParts(parts.map((p) => p.sm)),
    };
  });
  const commonPath = join(contentDir, "common", DATA_MODEL);
  const context = existsSync(commonPath) ? JSON.parse(readFileSync(commonPath, "utf-8")).context : undefined;
  return { namespaces: out, context };
}
