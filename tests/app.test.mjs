import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the BiteLog nutrition tracker", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /BiteLog/);
  assert.match(html, /Local nutrition tracker/);
  assert.match(html, /Scan your meal/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);

  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(pageSource, /USDA FoodData Central/);
  assert.match(pageSource, /Fruit\|apple\|Apple, Raw, With Skin\|apple\|171688/);
  assert.match(pageSource, /const FOOD_CATEGORIES/);
  assert.match(pageSource, /egg: \{ label: "egg", grams: 50 \}/);
});
