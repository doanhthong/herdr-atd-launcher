import { test } from "node:test";
import assert from "node:assert/strict";
import { splitFolderPath, matchFolders, completeFolder, parseFindOutput } from "../mods/atd-launcher/lib/folders.js";

test("splitFolderPath: folder and typed name", () => {
  assert.deepEqual(splitFolderPath("~/git-projects/her"), { dir: "~/git-projects/", partial: "her" });
  assert.deepEqual(splitFolderPath("~/code/"), { dir: "~/code/", partial: "" });
  assert.deepEqual(splitFolderPath("~"), { dir: "~/", partial: "" });
  assert.deepEqual(splitFolderPath("/"), { dir: "/", partial: "" });
  assert.deepEqual(splitFolderPath("/us"), { dir: "/", partial: "us" });
});

test("splitFolderPath: no suggestions for empty or relative text", () => {
  assert.equal(splitFolderPath(""), null);
  assert.equal(splitFolderPath("code/web"), null);
  assert.equal(splitFolderPath("~foo"), null);
});

test("matchFolders: prefix, case-insensitive, sorted", () => {
  assert.deepEqual(matchFolders(["herdr-old", "Herdr", "api", "herdr-atd-launcher"], "her"), ["Herdr", "herdr-atd-launcher", "herdr-old"]);
  assert.deepEqual(matchFolders(["b", "a", "C"], ""), ["a", "b", "C"]);
  assert.deepEqual(matchFolders(["web"], "x"), []);
});

test("matchFolders: hidden folders only after a dot", () => {
  assert.deepEqual(matchFolders([".config", "code"], ""), ["code"]);
  assert.deepEqual(matchFolders([".config", ".cache", "code"], "."), [".cache", ".config"]);
  assert.deepEqual(matchFolders([".config"], ".co"), [".config"]);
});

test("matchFolders: at most 8", () => {
  const names = Array.from({ length: 20 }, (_, i) => `d${String(i).padStart(2, "0")}`);
  assert.equal(matchFolders(names, "").length, 8);
  assert.equal(matchFolders(names, "", 3).length, 3);
});

test("completeFolder replaces the typed name and adds a slash", () => {
  assert.equal(completeFolder("~/git-projects/her", "herdr-atd-launcher"), "~/git-projects/herdr-atd-launcher/");
  assert.equal(completeFolder("~/code/", "web"), "~/code/web/");
  assert.equal(completeFolder("~", "code"), "~/code/");
  assert.equal(completeFolder("rel", "x"), "rel");
});

test("parseFindOutput keeps direct child names", () => {
  const out = "/Users/a/code/web\n/Users/a/code/api\n\n";
  assert.deepEqual(parseFindOutput(out, "/Users/a/code/"), ["web", "api"]);
  assert.deepEqual(parseFindOutput("/usr\n/tmp\n", "/"), ["usr", "tmp"]);
});
