import { cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildModel } from "../src/model/build";
import { loadRaw } from "../src/model/raw";

export const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures/content");

/** The made-up model every test works on. It contains no real Nexthink content. */
export const fixtureModel = () => buildModel(loadRaw(FIXTURE_DIR));

/** A throwaway copy of the fixture model that a test may edit. */
export function copyFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "dme-"));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  return dir;
}
