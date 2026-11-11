# TODO

- [ ] **Starter config shouldn't set `shortcut`** (from review of PR #1)
  `openConfigFile()` in `mod/main.js` creates the starter file with
  `shortcut: defaultShortcut(this.platform)`. Once `shortcut` is in the file, `syncShortcut` writes it
  to `keys.json` on every open and removes any other key bound to `mod.open:atd-launcher`. A user
  who picked their own key (README step 2, e.g. `alt-t` to keep Ctrl+T for fzf) gets it silently
  replaced by `ctrl-t` / `cmd-t` after clicking *Open config file*.
  Fix: leave `shortcut` out of the starter object, like PR #1 did for
  `examples/atd-launcher.example.json`. Check spec §8 still matches.
