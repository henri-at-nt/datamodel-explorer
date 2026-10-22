import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";
import { ModelCache } from "./model/cache";

export interface AppOptions {
  cache: ModelCache;
  /** Built web app to serve; the API works without it (development uses the Vite dev server). */
  webDist?: string;
}

export async function buildApp({ cache, webDist }: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  app.get("/api/health", async () => cache.info());

  app.post("/api/reload", async () => {
    cache.reload();
    return cache.info();
  });

  app.get("/api/namespaces", async () => cache.get().summaries);

  app.get<{ Params: { ns: string } }>("/api/namespaces/:ns", async (req, reply) => {
    const ns = cache.get().byName.get(req.params.ns);
    if (!ns) return reply.code(404).send({ error: `Unknown namespace '${req.params.ns}'` });
    return ns;
  });

  app.get<{ Querystring: { q?: string } }>("/api/search", async (req) => cache.get().search(req.query.q ?? ""));

  // Unknown API paths are 404s, never the web app.
  app.all("/api/*", async (_req, reply) => reply.code(404).send({ error: "Not found" }));

  if (webDist && existsSync(join(webDist, "index.html"))) {
    await app.register(fastifyStatic, { root: webDist });
    const indexHtml = readFileSync(join(webDist, "index.html"), "utf-8");
    // Client-side routes (/session/login) all serve the single page.
    app.setNotFoundHandler((_req, reply) => reply.type("text/html").send(indexHtml));
  }

  return app;
}
