import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConfig } from "../mod/lib/config.js";
import { buildMain, flatten, currentSavedSpace, typeIcon } from "../mod/lib/model.js";
import { hostActions, describe } from "../mod/lib/hostactions.js";

const home = "/Users/me";
const cfg = parseConfig(JSON.stringify({
  commands: [{ id: "claude", command: "claude", label: "Claude" }],
  spaces: [
    { id: "web", path: "~/code/web", commands: [{ id: "test", label: "Run tests", command: "pnpm test" }] },
    { id: "web-sub", path: "~/code/web/packages/ui" },
    { id: "docs", path: "~/code/docs" },
  ],
  quickActions: [{ command: "claude", label: "New Claude tab" }, { builtin: "new-tab" }, { command: "web/test" }, { command: "gone" }],
}));
const snap = {
  home,
  spaces: [{ id: "s1", name: "api", folder: "/Users/me/code/api", machine: null }, { id: "s2", name: "web", folder: "/Users/me/code/web", machine: null }],
  agents: [
    { address: "t1", space_name: "web", status: "working", title: "fix login", program: { name: "Claude" }, tab_name: "1" },
    { address: "t2", space_name: "api", status: "blocked", title: "rate limit", program: { name: "Codex" }, tab_name: "1" },
  ],
  focused: { space: "s2", terminal: "t1" },
};
const host = hostActions([{ name: "pane.split", args: [{ name: "direction", required: true }] }, { name: "layout.set", args: [{ name: "layout", required: true }] }, { name: "app.palette", args: [] }]);

test("deepest saved space wins", () => {
  assert.equal(currentSavedSpace(cfg, "/Users/me/code/web/packages/ui/src", null, home).id, "web-sub");
  assert.equal(currentSavedSpace(cfg, null, "/Users/me/code/web", home).id, "web");
  assert.equal(currentSavedSpace(cfg, "/tmp", null, home), null);
});
test("host actions hide unaskable and palette", () => {
  assert.deepEqual(host.map((h) => h.name), ["pane.split"]);
  assert.equal(describe("pane.wait_for_output").title, "Pane: Wait For Output");
});
test("main list order and contents", () => {
  const ctx = { hostActions: host, currentSaved: currentSavedSpace(cfg, "/Users/me/code/web", null, home) };
  const secs = buildMain(snap, cfg, ctx);
  assert.deepEqual(secs.map((s) => s.title), ["Quick Actions", "Agents", "Commands", "Spaces", "Settings", "Pane"]);
  assert.deepEqual(secs[0].rows.map((r) => r.label), ["New Claude tab", "New tab", "Run tests"]);
  assert.deepEqual(secs[1].rows.map((r) => r.agent.address), ["t2", "t1"]);
  assert.equal(secs[3].rows[0].label, "web"); // current open space first
  assert.equal(secs[3].rows.find((r) => r.key === "saved:web").icon, "→");
  assert.equal(secs[3].rows.find((r) => r.key === "saved:docs").icon, "+");
  assert.deepEqual(secs[2].rows.map((r) => r.label), ["Run tests", "Claude"]);
});
test("space commands hidden outside their space", () => {
  const secs = buildMain(snap, cfg, { hostActions: host, currentSaved: null });
  assert.deepEqual(secs[0].rows.map((r) => r.label), ["New Claude tab", "New tab"]);
  assert.deepEqual(secs[2].rows.map((r) => r.label), ["Claude"]);
});
test("search: one ranked list, pinned items once", () => {
  const secs = buildMain(snap, cfg, { hostActions: host, currentSaved: cfg.spaces[0] });
  const { items, total } = flatten(secs, "claude");
  const labels = items.map((i) => i.row.label);
  assert.ok(labels.includes("Claude"));
  assert.ok(!labels.includes("New Claude tab"));
  assert.ok(total > items.length);
  assert.ok(items.every((i) => i.row && i.row.tag));
});
test("flatten: items and rows share row objects, tagged sections too", () => {
  const secs = buildMain(snap, cfg, { hostActions: host, currentSaved: cfg.spaces[0] });
  assert.ok(secs.some((s) => s.tag && s.rows.length), "fixture has a tagged section");
  const { items, rows } = flatten(secs, "");
  const itemRows = items.filter((i) => i.row).map((i) => i.row);
  assert.equal(itemRows.length, rows.length);
  rows.forEach((r, i) => assert.equal(itemRows[i], r));
});
test("search: a command ranks above a space matching equally", () => {
  const c = parseConfig(JSON.stringify({
    commands: [{ id: "docs", command: "docs", label: "docs" }],
    spaces: [{ id: "docs", path: "~/code/docs" }],
    quickActions: [],
  }));
  const secs = buildMain({ ...snap, spaces: [], agents: [] }, c, { hostActions: [], currentSaved: null });
  const { rows } = flatten(secs, "docs");
  const iCmd = rows.findIndex((r) => r.kind === "command");
  const iSpace = rows.findIndex((r) => r.kind === "savedSpace");
  assert.ok(iCmd >= 0 && iSpace >= 0 && iCmd < iSpace);
});

test("typeIcon: one per kind, pins show their target's", () => {
  const secs = buildMain(snap, cfg, { hostActions: host, currentSaved: cfg.spaces[0] });
  const rows = secs.flatMap((s) => s.rows);
  const of = (pred) => typeIcon(rows.find(pred));
  assert.equal(of((r) => r.kind === "agent"), "🤖");
  assert.equal(of((r) => r.kind === "command"), "⚡");
  assert.equal(of((r) => r.kind === "savedSpace"), "📁");
  assert.equal(of((r) => r.kind === "openSpace"), "📁");
  assert.equal(of((r) => r.kind === "setting"), "⚙️");
  assert.equal(of((r) => r.kind === "host"), "🧩");
  assert.equal(of((r) => r.kind === "pin" && r.target.kind === "command"), "⚡");
  assert.equal(of((r) => r.kind === "pin" && r.target.kind === "builtin"), "✨");
});
