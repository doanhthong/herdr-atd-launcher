import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../mod/lib/config.js";

test("no file → defaults", () => {
  const c = C.parseConfig(null);
  assert.equal(c.fatal, null);
  assert.deepEqual(c.commands.map((x) => x.id), ["claude"]);
  assert.equal(c.quickActions.length, 3);
  assert.equal(c.shortcut, "cmd-t");
});
test("empty quickActions stays empty", () => {
  assert.equal(C.parseConfig('{"quickActions":[]}').quickActions.length, 0);
});
test("broken file → fatal + defaults", () => {
  const c = C.parseConfig("{ nope");
  assert.ok(c.fatal);
  assert.equal(c.commands.length, 1);
});
test("ids default to slugs; spec example parses", () => {
  const c = C.parseConfig(JSON.stringify({
    spaces: [{ id: "web", label: "web", path: "~/code/web", commands: [{ label: "Dev server", command: "pnpm dev" }] }, { path: "~/code/api" }],
    quickActions: [{ command: "web/dev-server" }, { space: "api" }, { action: "pane.split" }, { bogus: 1 }],
  }));
  assert.equal(c.spaces[1].id, "api");
  assert.equal(c.spaces[1].label, "api");
  assert.equal(C.findCommand(c, "web/dev-server").label, "Dev server");
  assert.equal(c.quickActions.length, 3);
  assert.equal(c.errors.length, 1);
});
test("duplicate slugs get suffixes", () => {
  const c = C.parseConfig('{"commands":[{"command":"claude"},{"command":"claude --resume"}]}');
  assert.deepEqual(c.commands.map((x) => x.id), ["claude", "claude-2"]);
});
test("edits keep unknown keys and order", () => {
  const raw = JSON.parse('{"zzz":1,"shortcut":"cmd-t","spaces":[{"path":"~/a","x":true}],"aaa":2}');
  const id = C.addSpace(raw, { label: "b", path: "~/b" });
  C.addCommand(raw, "a", { label: "Test", command: "pnpm test" });
  assert.deepEqual(Object.keys(raw), ["zzz", "shortcut", "spaces", "aaa"]);
  assert.equal(raw.spaces[0].id, "a");
  assert.equal(raw.spaces[0].x, true);
  assert.equal(id, "b");
  assert.equal(raw.spaces[0].commands[0].command, "pnpm test");
});
test("pinning writes the id; removing unpins", () => {
  const raw = { commands: [{ label: "Codex", command: "codex" }] };
  C.addPin(raw, { command: "codex", newTab: true });
  assert.equal(raw.commands[0].id, "codex");
  assert.equal(raw.quickActions.length, 4);
  C.removeCommand(raw, "codex");
  assert.equal(raw.quickActions.length, 3);
});
test("pinning the default command keeps commands implicit", () => {
  const raw = {};
  C.addPin(raw, { command: "claude" });
  assert.equal(raw.commands, undefined);
  assert.equal(raw.quickActions.at(-1).command, "claude");
});
test("move command retargets pins", () => {
  const raw = { spaces: [{ id: "web", path: "~/web" }], commands: [{ id: "t", command: "pnpm t" }], quickActions: [{ command: "t" }] };
  const ref = C.moveCommand(raw, "t", "web");
  assert.equal(ref, "web/t");
  assert.equal(raw.quickActions[0].command, "web/t");
  assert.equal(raw.commands.length, 0);
});
test("movePin / reset", () => {
  const raw = {};
  assert.equal(C.movePin(raw, 0, 1), 1);
  assert.equal(raw.quickActions[1].command, "claude");
  C.resetPins(raw);
  assert.equal(raw.quickActions, undefined);
});
test("choose space: parse, add, toggles", () => {
  const c = C.parseConfig(JSON.stringify({ quickActions: [{ command: "claude", chooseSpace: true }, { builtin: "new-tab", chooseSpace: true }, { builtin: "new-space", chooseSpace: true }] }));
  assert.deepEqual(c.quickActions.map((q) => [q.chooseSpace, q.newTab]), [[true, true], [true, true], [false, false]]);
  const raw = { quickActions: [{ command: "claude", newTab: true }, { builtin: "new-tab" }] };
  C.togglePinChooseSpace(raw, 0);
  assert.deepEqual(raw.quickActions[0], { command: "claude", chooseSpace: true });
  C.togglePinChooseSpace(raw, 0);
  assert.deepEqual(raw.quickActions[0], { command: "claude", newTab: true });
  C.togglePinChooseSpace(raw, 0);
  C.togglePinNewTab(raw, 0);
  assert.deepEqual(raw.quickActions[0], { command: "claude" });
  C.togglePinChooseSpace(raw, 1);
  C.togglePinChooseSpace(raw, 1);
  assert.deepEqual(raw.quickActions[1], { builtin: "new-tab" });
  C.addPin(raw, { command: "claude", newTab: true, chooseSpace: true });
  assert.deepEqual(raw.quickActions.at(-1), { command: "claude", chooseSpace: true });
});
