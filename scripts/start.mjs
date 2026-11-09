// npm start: the server, which also serves the built web app.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { supervise } from "./supervise.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tsx = createRequire(join(root, "server", "package.json")).resolve("tsx/cli");

supervise([{ name: "server", color: 34, cwd: join(root, "server"), args: [tsx, "src/index.ts"] }]);
