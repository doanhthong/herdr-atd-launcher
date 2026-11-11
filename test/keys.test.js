import { test } from "node:test";
import assert from "node:assert/strict";
import * as K from "../mod/lib/keys.js";

const mods = (o = {}) => ({ shift: false, control: false, alt: false, platform: false, function: false, ...o });

test("Alt stands in for ⌘ in every run key", () => {
  assert.equal(K.runMode(mods()), "enter");
  assert.equal(K.runMode(mods({ shift: true })), "pane");
  assert.equal(K.runMode(mods({ platform: true })), "tab");
  assert.equal(K.runMode(mods({ alt: true })), "tab");
  assert.equal(K.runMode(mods({ platform: true, shift: true })), "here");
  assert.equal(K.runMode(mods({ alt: true, shift: true })), "here");
});

test("hints and default shortcut follow the platform", () => {
  assert.equal(K.runKeyHints("macos").here, "⌘⇧↵");
  assert.equal(K.runKeyHints("linux").here, "Alt+⇧↵");
  assert.equal(K.runKeyHints("windows").tab, "Alt+↵");
  assert.equal(K.defaultShortcut("macos"), "cmd-t");
  assert.equal(K.defaultShortcut("linux"), "ctrl-t");
});

test("cmd shortcuts are flagged only off macOS", () => {
  assert.equal(K.unreachableShortcut("cmd-t", "macos"), false);
  assert.equal(K.unreachableShortcut("cmd-t", "linux"), true);
  assert.equal(K.unreachableShortcut("ctrl-shift-cmd-k", "windows"), true);
  assert.equal(K.unreachableShortcut("ctrl-t", "linux"), false);
});
