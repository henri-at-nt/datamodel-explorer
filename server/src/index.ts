import { buildApp } from "./app";
import { loadConfig } from "./config";
import { ModelCache } from "./model/cache";

const config = loadConfig();
const cache = new ModelCache(config.contentDir);
const started = Date.now();
const info = cache.info(); // build once at startup so a broken model fails fast
const app = await buildApp({ cache, webDist: config.webDist });
await app.listen({ port: config.port, host: config.host });
console.log(
  `datamodel-explorer on http://${config.host}:${config.port}  ` +
    `(${info.namespaces} namespaces, ${info.tables} tables, built in ${Date.now() - started} ms)\n` +
    `model: ${config.contentDir}`,
);
