// Starts the real server (npm run dev, npm start) several times and stops it in each way a host might, to check that
// nothing is left running and the ports are free. Uses ports 3000 and 5173, so stop your own server first.
//   npm run check:shutdown
import { execSync, spawn } from "node:child_process";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ALL_PORTS = [3000, 5173];
const PATTERN = `${root}.*(scripts/(dev|start).mjs|tsx|vite)`;
const WITHIN_MS = 8000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sh = (cmd) => { try { return execSync(cmd, { encoding: "utf-8" }).trim(); } catch { return ""; } };
const listening = (port) => sh(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`) !== "";
const leftovers = () => sh(`pgrep -f "${PATTERN}"`).split("\n").filter(Boolean);

if (ALL_PORTS.some(listening)) {
  console.error(`Ports ${ALL_PORTS.join(" and ")} are in use. Stop the running server first.`);
  process.exit(2);
}

const failures = [];

async function scenario(name, npmArgs, PORTS, stop) {
  const top = spawn("npm", npmArgs, { cwd: root, stdio: "ignore" });
  for (let i = 0; i < 60 && !PORTS.every(listening); i++) await sleep(500);
  if (!PORTS.every(listening)) {
    failures.push(`${name}: the server did not start`);
    top.kill("SIGKILL");
    await sleep(500);
    sh(`pkill -KILL -f "${PATTERN}"`);
    return;
  }

  // What a browser tab holds open: keep-alive connections and the hot-reload WebSocket.
  const agent = new http.Agent({ keepAlive: true });
  const get = (port, path) => new Promise((res) => http.get({ port, path, agent, headers: { Accept: "text/html" } }, (r) => { r.resume(); r.on("end", res); }));
  await get(3000, "/api/health");
  if (PORTS.includes(5173)) await get(5173, "/");
  let ws = null;
  if (PORTS.includes(5173)) {
    const client = await (await fetch("http://127.0.0.1:5173/@vite/client")).text();
    const token = client.match(/wsToken = "([^"]+)"/)?.[1];
    ws = token ? new WebSocket(`ws://127.0.0.1:5173/?token=${token}`, "vite-hmr") : null;
  }
  await sleep(800);

  const started = Date.now();
  stop(top);
  let clean = false;
  while (Date.now() - started < WITHIN_MS) {
    await sleep(250);
    if (leftovers().length === 0 && !PORTS.some(listening)) { clean = true; break; }
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (clean) console.log(`ok    ${name}: everything stopped after ${seconds}s`);
  else {
    const left = leftovers();
    failures.push(`${name}: ${left.length} process(es) still running after ${seconds}s, ports ${PORTS.filter(listening).join(", ") || "free"}`);
    console.log(`FAIL  ${failures.at(-1)}`);
    sh(`pkill -KILL -f "${PATTERN}"`);
  }
  try { ws?.close(); } catch { /* already closed */ }
  agent.destroy();
  await sleep(500);
}

for (const [label, npmArgs, ports] of [["dev", ["run", "dev"], ALL_PORTS], ["start", ["start"], [3000]]]) {
  await scenario(`${label}: SIGTERM to npm`, npmArgs, ports, (top) => top.kill("SIGTERM"));
  await scenario(`${label}: SIGINT to npm`, npmArgs, ports, (top) => top.kill("SIGINT"));
  await scenario(`${label}: SIGHUP to npm`, npmArgs, ports, (top) => top.kill("SIGHUP"));
  await scenario(`${label}: npm killed (SIGKILL)`, npmArgs, ports, (top) => top.kill("SIGKILL"));
}

if (failures.length) {
  console.log(`\n${failures.length} scenario(s) failed`);
  process.exit(1);
}
console.log("\nshutdown check passed");
