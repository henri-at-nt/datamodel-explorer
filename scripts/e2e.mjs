// Browser test: opens every namespace and table of the running app and exercises each feature.
//   npm run build && npm start        (in one terminal)
//   E2E_URL=http://127.0.0.1:3000 BROWSER_PATH=/path/to/chrome npm run e2e
// BROWSER_PATH defaults to a Chrome for Testing found in the Playwright cache, else the installed Chrome.
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const BASE = process.env.E2E_URL || "http://127.0.0.1:3000";

function findBrowser() {
  if (process.env.BROWSER_PATH) return process.env.BROWSER_PATH;
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  if (!existsSync(cache)) return undefined;
  for (const dir of readdirSync(cache).filter((d) => d.startsWith("chromium-")).sort().reverse()) {
    for (const arch of ["chrome-mac-arm64", "chrome-mac-x64", "chrome-mac"]) {
      const exe = join(cache, dir, arch, "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
      if (existsSync(exe)) return exe;
    }
  }
}

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const errors = [];

const executablePath = findBrowser();
const browser = await chromium.launch(executablePath ? { executablePath } : { channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });

const summaries = await (await fetch(`${BASE}/api/namespaces`)).json();
const tableCount = summaries.reduce((n, s) => n + s.tables.length, 0);

/** Client-side navigation, as a click on a link would do it. */
const go = async (path) => {
  await page.evaluate((p) => { history.pushState({}, "", p); dispatchEvent(new PopStateEvent("popstate")); }, path);
};

// --- home and navigation -----------------------------------------------------------
await page.goto(BASE + "/", { waitUntil: "load" });
await page.waitForSelector(".ns-grid");
check((await page.locator(".ns-grid a").count()) === summaries.length, "home lists every namespace");
check((await page.locator("nav .tbl-list").count()) === 1, "only the first namespace starts expanded");
await page.locator('nav button[aria-label^="Collapse"]').first().click();
check((await page.locator("nav .tbl-list").count()) === 0, "caret collapses a namespace");
await page.locator('nav button[aria-label^="Expand"]').first().click();
check((await page.locator("nav .tbl-list").count()) === 1, "caret expands a namespace");

// --- every namespace overview --------------------------------------------------------
for (const ns of summaries) {
  await go(`/${ns.name}`);
  await page.waitForSelector(".diagram svg, .muted:has-text('No storage mappings'), .err", { timeout: 30000 });
  check((await page.locator(".err").count()) === 0, `${ns.name}: overview error`);
  check((await page.locator("nav a[aria-current='page']").count()) >= 1, `${ns.name}: nav marks the current page`);
}

// --- every table page, with duplicates check ------------------------------------------
let relDiagrams = 0;
for (const ns of summaries) {
  const names = ns.tables.map((t) => t.name);
  check(new Set(names).size === names.length, `${ns.name}: table names are not unique, URLs would clash`);
  for (const t of ns.tables) {
    await go(`/${ns.name}/${t.name}`);
    await page.waitForSelector("h1", { timeout: 10000 });
    const h1 = await page.locator("h1").innerText();
    check(h1 && h1 !== "Not found", `${ns.name}/${t.name}: page did not render (${h1})`);
    const details = await (await fetch(`${BASE}/api/namespaces/${ns.name}`)).json();
    const rec = details.tables.find((x) => x.key === t.key);
    if (rec.relations.length) {
      await page.waitForSelector(".reldiagram svg, .reldiagram .err", { timeout: 15000 });
      if (await page.locator(".reldiagram .err").count()) failures.push(`${ns.name}/${t.name}: relationship diagram failed`);
      else relDiagrams++;
    }
  }
}

// --- features, against the first namespace that has what each needs ---------------------
// Hover popup and zoom on the largest overview.
const biggest = [...summaries].sort((a, b) => b.storeEntities - a.storeEntities)[0];
await go(`/${biggest.name}`);
await page.waitForSelector(".diagram svg");
const box = page.locator('.diagram g[id^="entity-"]').first();
await box.hover();
check(await page.locator(".popup").isVisible(), "hover shows the popup");
await page.mouse.move(2, 2);
check((await page.locator(".popup").count()) === 0, "popup disappears when the pointer leaves");
const zoomBefore = await page.locator(".zoom output").innerText();
await page.locator('button[title="Zoom in"]').click();
check((await page.locator(".zoom output").innerText()) !== zoomBefore, "zoom in changes the zoom level");
await page.locator('button[title="Fit to width"]').click();
check(/%$/.test(await page.locator(".zoom output").innerText()), "fit sets a zoom level");
await page.locator('button[title="Actual size"]').click();
check((await page.locator(".zoom output").innerText()) === "100%", "100% resets the zoom");

// KPI filters on a table that has structured fields.
const withStructured = (await Promise.all(summaries.map(async (ns) => {
  const d = await (await fetch(`${BASE}/api/namespaces/${ns.name}`)).json();
  const t = d.tables.find((x) => x.structured.length && x.relations.length);
  return t ? { ns: ns.name, name: t.name, t } : null;
}))).find(Boolean);
if (withStructured) {
  await go(`/${withStructured.ns}/${withStructured.name}`);
  await page.waitForSelector("h1");
  await page.locator('button.stat:has-text("structured fields")').click();
  check(await page.locator(".filter-banner").isVisible(), "filter banner appears");
  check((await page.locator("h2.sec", { hasText: /^Fields$/ }).count()) === 0, "filter hides the field table");
  check((await page.locator("h2.sec", { hasText: "Structured fields" }).count()) === 1, "filter keeps the chosen section");
  await page.locator("button", { hasText: "Clear filter" }).click();
  check((await page.locator(".filter-banner").count()) === 0, "clear filter removes the banner");
  await page.locator('button.stat:has-text("structured fields")').click();
  await page.locator('button.stat:has-text("structured fields")').click();
  check((await page.locator(".filter-banner").count()) === 0, "clicking the active card clears the filter");
  await page.locator('button.stat:has-text("structured fields")').click();
  await go(`/${withStructured.ns}`);
  await go(`/${withStructured.ns}/${withStructured.name}`);
  await page.waitForSelector("h1");
  check((await page.locator(".filter-banner").count()) === 0, "filter does not follow to another visit");
}

// Structured types never show a zero count (metrics are included).
for (const ns of summaries) {
  const d = await (await fetch(`${BASE}/api/namespaces/${ns.name}`)).json();
  for (const [k, ty] of Object.entries(d.types)) check(ty.fields.length + ty.structured.length > 0, `${ns.name}: type ${k} is empty`);
}

// Cross-namespace link: any relation whose target names another namespace.
let cross = null;
for (const ns of summaries) {
  const d = await (await fetch(`${BASE}/api/namespaces/${ns.name}`)).json();
  for (const t of d.tables) {
    const r = t.relations.find((x) => x.target && x.target.includes("::"));
    if (r) { cross = { ns: ns.name, table: t.name, target: r.target, targetName: r.targetName }; break; }
  }
  if (cross) break;
}
check(!!cross, "the model has at least one cross-namespace link to test");
if (cross) {
  await go(`/${cross.ns}/${cross.table}`);
  await page.waitForSelector("h1");
  await page.locator("summary", { hasText: "As list" }).click();
  const [targetNs] = cross.target.split("::");
  await page.locator(`ul.rel a.link:text-is("${cross.targetName}")`).first().click();
  await page.waitForFunction((ns) => location.pathname.startsWith(`/${ns}/`), targetNs);
  await page.waitForSelector("h1");
  const here = await page.evaluate(() => location.pathname.split("/")[1]);
  check(here === targetNs, `cross-namespace link opens ${targetNs} (got ${here})`);
  check((await page.locator("nav a[aria-current='page']").count()) === 1, "the target table is marked in the expanded nav");
}

// Collections (JSON arrays on an object, such as device.cpus) are pages of their own.
let collection = null;
for (const ns of summaries) {
  const t = ns.tables.find((x) => x.kind === "collection");
  if (t) { collection = { ns: ns.name, ...t, parentTable: ns.tables.find((x) => x.key === t.parent) }; break; }
}
check(!!collection, "the model has at least one collection to test");
if (collection) {
  const parentNs = summaries.find((s) => s.name === collection.ns);
  const idx = parentNs.tables.findIndex((x) => x.key === collection.key);
  check(parentNs.tables[idx - 1]?.key === collection.parent || parentNs.tables[idx - 1]?.parent === collection.parent,
        "the API lists a collection directly after its parent");
  await page.goto(`${BASE}/${collection.ns}/${collection.name}`, { waitUntil: "load" });
  await page.waitForSelector("h1");
  const sub = await page.locator("p.sub").innerText();
  check(sub.includes("Collection") && sub.includes("JSON array"), `collection header says what it is (${sub})`);
  check((await page.locator("th", { hasText: "JSON path" }).count()) === 1, "collection fields show a JSON path column");
  check((await page.locator("nav a.child").count()) >= 1, "nav indents collections under their parent");
  check((await page.locator("nav a.child[aria-current='page']").count()) === 1, "the collection is marked in the nav");
  const highlight = await page.locator("nav a[aria-current='page']").evaluate((el) => getComputedStyle(el).backgroundColor);
  check(highlight !== "rgba(0, 0, 0, 0)" && highlight !== "transparent", `the current page is visibly highlighted in the nav (${highlight})`);
  await page.waitForSelector(".reldiagram svg");
  check((await page.locator("body").innerText()).includes("declares no table, column mapping or Kafka topic"), "storage says nothing is declared");
  await page.locator("p.sub a.link").click();
  await page.waitForFunction((n) => location.pathname.endsWith("/" + n), collection.parentTable.name);
  check((await page.locator("h1").innerText()).length > 0, "the parent link opens the parent");
  await page.locator("summary", { hasText: "As list" }).click();
  check((await page.locator(`ul.rel a.link:text-is("${collection.name}")`).count()) >= 1, "the parent links to the collection");
  await page.keyboard.press("/");
  await page.keyboard.type(collection.name);
  await page.waitForSelector(".search .result");
  check((await page.locator(".search .result").first().locator(".kind").innerText()).toLowerCase() === "table", "search finds the collection by its NQL name first");
  await page.keyboard.press("Enter");
  await page.waitForFunction((n) => decodeURIComponent(location.pathname).endsWith("/" + n), collection.name);
}

// Links to configured objects, links from both ends across namespaces, parents, and the diagram cap.
const allDetails = [];
for (const ns of summaries) allDetails.push({ ns: ns.name, d: await (await fetch(`${BASE}/api/namespaces/${ns.name}`)).json() });
const tableOf = (nsName, key) => allDetails.find((x) => x.ns === nsName)?.d.tables.find((t) => t.key === key);
const resolveRel = (nsName, r) => {
  const [tns, key] = r.target.includes("::") ? r.target.split("::") : [nsName, r.target];
  return { ns: tns, table: tableOf(tns, key) };
};

// A link from a timeseries to a configured object appears on both pages.
let configLink = null;
for (const { ns, d } of allDetails) {
  for (const t of d.tables) {
    const r = t.relations.find((x) => x.direction === "out" && x.via === "object link" && x.target && resolveRel(ns, x).table?.kind === "configObject");
    if (r) { configLink = { ns, t, r, target: resolveRel(ns, r) }; break; }
  }
  if (configLink) break;
}
check(!!configLink, "the model links at least one table to a configured object");
if (configLink) {
  const back = configLink.target.table.relations.find((x) => x.direction === "in" && x.via === "object link" && x.targetName.endsWith(configLink.t.name));
  check(!!back, `${configLink.target.table.name} lists ${configLink.t.name} as an incoming link`);
  await page.goto(`${BASE}/${configLink.ns}/${configLink.t.name}`, { waitUntil: "load" });
  await page.waitForSelector(".reldiagram svg");
  await page.locator("summary", { hasText: "As list" }).click();
  check((await page.locator(`ul.rel a.link:text-is("${configLink.r.targetName}")`).count()) >= 1, "the table page links to its configured object");
  check((await page.locator("ul.rel").innerText()).includes("config object"), "the explanation names it a config object");
}

// Incoming links across namespaces are listed with the namespace in the name.
let crossIn = null;
for (const { ns, d } of allDetails) {
  for (const t of d.tables) {
    const r = t.relations.find((x) => x.direction === "in" && x.target?.includes("::"));
    if (r) { crossIn = { ns, t, r }; break; }
  }
  if (crossIn) break;
}
check(!!crossIn, "the model has an incoming link from another namespace");
if (crossIn) {
  check(crossIn.r.targetName.includes("."), `cross-namespace incoming name carries the namespace (${crossIn.r.targetName})`);
  await page.goto(`${BASE}/${crossIn.ns}/${crossIn.t.name}`, { waitUntil: "load" });
  await page.waitForSelector(".reldiagram svg");
  await page.locator("summary", { hasText: "As list" }).click();
  await page.locator(`ul.rel a.link:text-is("${crossIn.r.targetName}")`).first().click();
  const [targetNs] = crossIn.r.target.split("::");
  await page.waitForFunction((n) => location.pathname.startsWith(`/${n}/`), targetNs);
  check(true, "");
}

// Parents.
const withParent = allDetails.flatMap(({ ns, d }) => d.tables.filter((t) => t.relations.some((r) => r.via === "parent object" && r.direction === "out")).map((t) => ({ ns, t })))[0];
if (withParent) {
  await page.goto(`${BASE}/${withParent.ns}/${withParent.t.name}`, { waitUntil: "load" });
  await page.waitForSelector(".reldiagram svg");
  await page.locator("summary", { hasText: "As list" }).click();
  check((await page.locator("ul.rel").innerText()).includes("parent object"), "the child lists its parent");
  const parentName = withParent.t.relations.find((r) => r.via === "parent object").targetName;
  await page.locator(`ul.rel a.link:text-is("${parentName}")`).first().click();
  await page.waitForFunction((n) => decodeURIComponent(location.pathname).endsWith("/" + n), parentName);
  await page.locator("summary", { hasText: "As list" }).click();
  check((await page.locator("ul.rel").innerText()).includes(withParent.t.name), "the parent lists its child");
}

// Contexts: one box per diagram, different per table, one entry in the relation list.
const ctxTables = allDetails.flatMap(({ ns, d }) => d.tables.filter((t) => t.relations.length).map((t) => ({ ns, t })));
const richest = ctxTables.filter((x) => x.t.contexts.length).sort((a, b) => b.t.contexts.length - a.t.contexts.length)[0];
const sparsest = ctxTables.filter((x) => x.t.contexts.length).sort((a, b) => a.t.contexts.length - b.t.contexts.length)[0];
const none = ctxTables.find((x) => x.t.contexts.length === 0);
const contextBoxText = async (x) => {
  await page.goto(`${BASE}/${x.ns}/${x.t.name}`, { waitUntil: "load" });
  await page.waitForSelector(".reldiagram svg");
  return (await page.locator(".reldiagram .nodeLabel").allInnerTexts()).filter((t) => t.startsWith("Context"));
};
if (richest) {
  const boxes = await contextBoxText(richest);
  check(boxes.length === 1, `${richest.t.name}: exactly one context box (got ${boxes.length})`);
  for (const c of richest.t.contexts) check(boxes[0]?.includes(c.name), `${richest.t.name}: the context box names ${c.name}`);
  const someField = richest.t.contexts.flatMap((c) => c.groups.flatMap((g) => g.fields))[0];
  check(!someField || boxes[0]?.includes(someField), `${richest.t.name}: the context box lists fields (${someField})`);
  const rights = await page.locator(".reldiagram .node").evaluateAll((els) =>
    els.map((e) => ({ right: e.getBoundingClientRect().right, context: (e.textContent || "").startsWith("Context") })));
  const contextRight = rights.find((r) => r.context)?.right ?? 0;
  const otherRight = Math.max(...rights.filter((r) => !r.context).map((r) => r.right));
  check(contextRight >= otherRight - 2, `${richest.t.name}: the context box is the rightmost box`);
  await page.locator("summary", { hasText: "As list" }).click();
  const viaTexts = await page.locator('details:has(> summary:has-text("As list")) ul.rel .via').allInnerTexts();
  check(viaTexts.filter((v) => v === "context").length === 1, `${richest.t.name}: one context entry in the list`);
}
if (richest && sparsest && JSON.stringify(richest.t.contexts.map((c) => c.name)) !== JSON.stringify(sparsest.t.contexts.map((c) => c.name))) {
  const boxes = await contextBoxText(sparsest);
  const missing = richest.t.contexts.map((c) => c.name).filter((n) => !sparsest.t.contexts.some((c) => c.name === n));
  check(missing.every((n) => !boxes[0]?.includes(n)), `${sparsest.t.name}: its context box leaves out ${missing.join(", ")}`);
}
if (none) check((await contextBoxText(none)).length === 0, `${none.t.name}: no context box without contexts`);

// The diagram draws at most twelve incoming relations and summarises the rest.
const busiest = allDetails.flatMap(({ ns, d }) => d.tables.map((t) => ({ ns, t, n: t.relations.filter((r) => r.direction === "in").length }))).sort((a, b) => b.n - a.n)[0];
if (busiest.n > 12) {
  await page.goto(`${BASE}/${busiest.ns}/${busiest.t.name}`, { waitUntil: "load" });
  await page.waitForSelector(".reldiagram svg");
  const text = await page.locator(".reldiagram").innerText();
  check(text.includes(`and ${busiest.n - 12} more`), `${busiest.t.name}: the diagram summarises ${busiest.n - 12} incoming relations (${busiest.n} in total)`);
  const crossCount = busiest.t.relations.filter((r) => r.direction === "in" && r.target?.includes("::")).length;
  if (crossCount) {
    const shown = await page.locator(".reldiagram .nodeLabel").allInnerTexts();
    check(shown.some((t) => /\(\w+\)$/.test(t.trim())), "diagram boxes for other namespaces name their namespace");
    check(new Set(shown).size === shown.length, "no two boxes in the diagram share a label");
  }
  await page.locator("summary", { hasText: "As list" }).click();
  check((await page.locator('details:has(> summary:has-text("As list")) ul.rel > li').count()) === busiest.t.relations.length, "the list still shows every relation");
}

// Direct load and unknown addresses.
const sample = summaries.find((s) => s.tables.length);
await page.goto(`${BASE}/${sample.name}/${sample.tables[0].name}`, { waitUntil: "load" });
await page.waitForSelector("h1");
check((await page.locator("nav a[aria-current='page']").count()) === 1, "direct load marks the table in the nav");
await page.goto(`${BASE}/${sample.name}/does-not-exist`, { waitUntil: "load" });
check((await page.locator("h1").innerText()) === "Not found", "unknown table shows not found");
await page.goto(`${BASE}/nope/nothing`, { waitUntil: "load" });
check((await page.locator("h1").innerText()) === "Not found", "unknown namespace shows not found");

// Search: slash shortcut, ranking, keyboard selection.
await page.goto(`${BASE}/`, { waitUntil: "load" });
await page.waitForSelector(".ns-grid");
await page.keyboard.press("/");
check(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Search the data model"), "/ focuses the search");
await page.keyboard.type("LOGIN");
await page.waitForSelector(".search .result");
const firstKind = await page.locator(".search .result").first().locator(".kind").innerText();
check(firstKind.toLowerCase() === "table", `search ranks a table first (got ${firstKind})`);
await page.keyboard.press("Enter");
await page.waitForFunction(() => location.pathname.split("/").length === 3);
check((await page.locator("h1").innerText()).length > 0, "Enter opens the first result");
await page.keyboard.press("/");
await page.keyboard.type("x");
check((await page.locator(".search .result").count()) === 0, "one character shows no results");

// Phone width: nothing overflows horizontally.
await page.setViewportSize({ width: 390, height: 800 });
await page.goto(`${BASE}/${sample.name}/${sample.tables[0].name}`, { waitUntil: "load" });
await page.waitForSelector("h1");
check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal page scroll at phone width");

await browser.close();

check(errors.length === 0, `console/page errors: ${errors.slice(0, 5).join(" | ")}`);
console.log(`namespaces ${summaries.length}, tables ${tableCount}, relationship diagrams ${relDiagrams}`);
if (failures.length) {
  console.log(`FAILED (${failures.length})`);
  for (const f of failures) console.log(" - " + f);
  process.exit(1);
}
console.log("e2e passed");
