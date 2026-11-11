import { test } from "node:test";
import assert from "node:assert/strict";
import { fuzzyScore, scoreFields } from "../mods/atd-launcher/lib/fuzzy.js";

test("matches characters in order, case-insensitive", () => {
  assert.ok(fuzzyScore("ncl", "New Claude tab") != null);
  assert.equal(fuzzyScore("lcn", "New Claude tab"), null);
});
test("word starts beat mid-word matches", () => {
  assert.ok(fuzzyScore("ps", "Pane: Split") > fuzzyScore("ps", "upset"));
});
test("consecutive beats scattered", () => {
  assert.ok(fuzzyScore("dev", "Dev server") > fuzzyScore("dev", "Docker env vars"));
});
test("shorter text ranks higher", () => {
  assert.ok(fuzzyScore("web", "web") > fuzzyScore("web", "web application server"));
});
test("extra fields match but rank lower", () => {
  assert.ok(scoreFields("pnpm", "Dev server", ["pnpm dev"]) != null);
  assert.ok(scoreFields("dev", "Dev server", []) > scoreFields("dev", "Server", ["dev"]));
});
