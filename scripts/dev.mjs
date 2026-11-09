// npm run dev: the API (restarting on changes) and the web dev server, together.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { supervise } from "./supervise.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const requireFrom = (dir) => createRequire(join(root, dir, "package.json"));
const vite = join(dirname(requireFrom("web").resolve("vite/package.json")), "bin/vite.js");
const tsx = requireFrom("server").resolve("tsx/cli");

supervise([
  { name: "server", color: 34, cwd: join(root, "server"), args: [tsx, "watch", "src/index.ts"] },
  { name: "web", color: 32, cwd: join(root, "web"), args: [vite] },
]);
