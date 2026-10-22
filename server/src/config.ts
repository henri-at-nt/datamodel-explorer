import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export interface Config {
  contentDir: string;
  port: number;
  host: string;
  webDist: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Default: the data-model-content clone in the surrounding Endpoint studio workspace.
  const defaultDir = resolve(repoRoot, "../../repos/data-platform.data-model-content/content");
  const contentDir = resolve(env.DATA_MODEL_CONTENT_DIR || defaultDir);
  if (!existsSync(resolve(contentDir, "feature"))) {
    throw new Error(
      `No model files found: ${contentDir}/feature does not exist. ` +
        "Set DATA_MODEL_CONTENT_DIR to the 'content' folder of data-platform.data-model-content.",
    );
  }
  return {
    contentDir,
    port: Number(env.PORT || 3000),
    host: env.HOST || "127.0.0.1",
    webDist: resolve(repoRoot, "web/dist"),
  };
}
