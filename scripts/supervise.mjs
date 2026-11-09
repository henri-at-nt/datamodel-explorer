// Runs processes together and stops all of them, and everything they started, when asked to stop: on interrupt,
// terminate, hangup or quit, when any of them exits, and when the process that started this one is gone. Each runs in
// its own process group so a signal reaches its children too.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const GRACE_MS = 3000;

/** parts: [{ name, color, cwd, args }], run with this Node. */
export function supervise(parts) {
  let stopping = false;
  let exitCode = 0;
  const running = new Map(); // pid -> part

  const signalGroup = (pid, signal) => {
    try { process.kill(-pid, signal); } catch { /* already gone */ }
  };

  function stop(code, reason) {
    if (stopping) return;
    stopping = true;
    exitCode = code;
    console.log(`[supervisor] stopping (${reason})`);
    for (const pid of running.keys()) signalGroup(pid, "SIGTERM");
    if (running.size === 0) process.exit(code);
    setTimeout(() => {
      for (const pid of running.keys()) signalGroup(pid, "SIGKILL");
      process.exit(code);
    }, GRACE_MS).unref();
  }

  for (const part of parts) {
    const child = spawn(process.execPath, part.args, { cwd: part.cwd, stdio: ["ignore", "pipe", "pipe"], detached: true });
    running.set(child.pid, part);
    for (const stream of [child.stdout, child.stderr]) {
      createInterface({ input: stream }).on("line", (line) => console.log(`\u001b[${part.color}m[${part.name}]\u001b[0m ${line}`));
    }
    child.on("exit", (code, signal) => {
      running.delete(child.pid);
      if (!stopping) stop(code ?? 1, `${part.name} exited${signal ? ` with ${signal}` : code ? ` with code ${code}` : ""}`);
      else if (running.size === 0) process.exit(exitCode);
    });
  }

  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT"]) process.on(signal, () => stop(0, signal));

  // The process above us may be killed or hung up without being able to tell us: notice when we are orphaned.
  const parent = process.ppid;
  setInterval(() => { if (process.ppid !== parent) stop(0, "the process that started this one is gone"); }, 1000);

  // Last resort if we are exiting for any other reason.
  process.on("exit", () => { for (const pid of running.keys()) signalGroup(pid, "SIGKILL"); });
}
