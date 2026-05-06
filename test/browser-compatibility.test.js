import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("browser assets use relative paths and avoid Codex-only preview wiring", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

  assert.match(html, /href="\.\//);
  assert.match(html, /src="\.\//);
  assert.doesNotMatch(appJs, /localhost/i);
  assert.doesNotMatch(appJs, /127\.0\.0\.1/);
  assert.doesNotMatch(appJs, /\/api\/brazil-cost-calculator\/b2c-direct-mail/);
  assert.doesNotMatch(appJs, /codex/i);
  assert.match(appJs, /calculateBrazilB2CDirectMailCost/);
});
