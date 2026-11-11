import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../mod/lib/config.js";

test("no file → defaults", () => {
  const c = C.parseConfig(null);
  assert.equal(c.fatal, null);
  assert.deepEqual(c.commands.map((x) => x.id), ["claude"]);
  assert.equal(c.quickActions.length, 3);
  assert.equal(c.shortcut, "ctrl-t");
  assert.equal(C.parseConfig(null, "macos").shortcut, "cmd-t");
  assert.equal(C.parseConfig(null, "windows").shortcut, "ctrl-t");
});
test("setShortcut skips the platform default when the file has none", () => {
  const raw = {};
  C.setShortcut(raw, "ctrl-t", "linux");
  assert.equal(raw.shortcut, undefined);
  C.setShortcut(raw, "ctrl-t", "macos");
  assert.equal(raw.shortcut, "ctrl-t");
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
  C.addPin(raw, { command: "codex" });
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
test("askSpace: defaults, explicit value, edit", () => {
  const c = C.parseConfig(JSON.stringify({
    commands: [{ id: "a", command: "a" }, { id: "b", command: "b", askSpace: false }],
    spaces: [{ id: "web", path: "~/web", commands: [{ id: "t", command: "t" }, { id: "u", command: "u", askSpace: true }] }],
  }));
  assert.deepEqual(c.commands.map((x) => x.askSpace), [true, false]);
  assert.deepEqual(c.spaces[0].commands.map((x) => x.askSpace), [false, true]);
  const raw = c.raw;
  C.updateCommand(raw, "a", { askSpace: false });
  assert.equal(raw.commands[0].askSpace, false);
  const ref = C.addCommand(raw, null, { label: "X", command: "x", askSpace: false });
  assert.equal(C.findCommand(C.normalize(raw), ref).askSpace, false);
});
test("pins have no behaviour fields; old ones are ignored and dropped on rewrite", () => {
  const raw = { quickActions: [{ command: "claude", newTab: true }, { builtin: "new-tab", chooseSpace: true }] };
  const c = C.normalize(raw);
  assert.equal(c.quickActions[0].newTab, undefined);
  C.addPin(raw, { command: "claude", newTab: true, chooseSpace: true });
  assert.deepEqual(raw.quickActions.at(-1), { command: "claude" });
  C.renamePin(raw, 0, "Claude");
  assert.deepEqual(raw.quickActions[0], { command: "claude", label: "Claude" });
  C.movePin(raw, 1, 1);
  assert.deepEqual(raw.quickActions[2], { builtin: "new-tab" });
});
