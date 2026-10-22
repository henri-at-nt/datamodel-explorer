import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** The model JSON is large and loosely typed; the generators read it defensively. */
export type Raw = Record<string, any>;

export interface RawNamespace {
  name: string;
  /** nql-data-model.json: the product-facing tables, fields and enums. */
  dm: Raw;
  /** nql-store-model.json: the binding to Kafka topics and ClickHouse tables. */
  sm: Raw;
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

export function loadRaw(contentDir: string): RawNamespace[] {
  const feature = join(contentDir, "feature");
  const out: RawNamespace[] = [];
  for (const name of readdirSync(feature).sort()) {
    const dmPath = join(feature, name, DATA_MODEL);
    if (!existsSync(dmPath)) continue;
    const smPath = join(feature, name, STORE_MODEL);
    out.push({ name, dm: readNamespace(dmPath), sm: existsSync(smPath) ? readNamespace(smPath) : {} });
  }
  return out;
}
