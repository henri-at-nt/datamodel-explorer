import type { HealthInfo } from "@dme/shared";
import { buildModel, type Model } from "./build";
import { fingerprintFiles, listModelFiles, loadRaw } from "./raw";

export interface CacheOptions {
  /** Minimum time between checks of the model files. Default: one minute. */
  checkIntervalMs?: number;
  now?: () => number;
}

/**
 * Builds the model on first use and serves it from memory. At most once per interval, the next request
 * hashes the model files and rebuilds only when the hash changed.
 */
export class ModelCache {
  private model?: Model;
  private fingerprint = "";
  private builtAt = 0;
  private lastCheck = 0;
  private readonly interval: number;
  private readonly now: () => number;

  constructor(readonly contentDir: string, options: CacheOptions = {}) {
    this.interval = options.checkIntervalMs ?? 60_000;
    this.now = options.now ?? Date.now;
  }

  get(): Model {
    const now = this.now();
    if (this.model && now - this.lastCheck < this.interval) return this.model;
    this.lastCheck = now;
    const fingerprint = fingerprintFiles(listModelFiles(this.contentDir));
    if (this.model && fingerprint === this.fingerprint) return this.model;
    return this.rebuild(fingerprint);
  }

  /** Rebuilds regardless of the interval; the hash is still recorded so the next check is cheap. */
  reload(): Model {
    this.lastCheck = this.now();
    return this.rebuild(fingerprintFiles(listModelFiles(this.contentDir)));
  }

  private rebuild(fingerprint: string): Model {
    const model = buildModel(loadRaw(this.contentDir));
    this.model = model;
    this.fingerprint = fingerprint;
    this.builtAt = this.now();
    return model;
  }

  info(): HealthInfo {
    const model = this.get();
    return {
      ok: true,
      contentDir: this.contentDir,
      fingerprint: this.fingerprint,
      builtAt: new Date(this.builtAt).toISOString(),
      namespaces: model.namespaces.length,
      tables: model.namespaces.reduce((n, ns) => n + ns.tables.length, 0),
    };
  }
}
