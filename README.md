# herdr-atd-launcher

A command palette mod for herdr-app. Behavior: `docs/BEHAVIOR-SPEC-v2.md`.

- `mod/` — the mod (`main.js` UI and flows; `lib/` pure logic: fuzzy search, config, row model, host actions)
- `test/` — `npm test` (node's test runner, pure modules only)
- `scripts/sync.sh` — copies `mod/` to `~/.config/herdr-app/mods/atd-launcher` (`--watch` with fswatch). A symlink isn't watched by herdr-app, so the files are copied.

Dev loop:

```sh
./scripts/sync.sh && herdr-app check ~/.config/herdr-app/mods/atd-launcher
# an open palette keeps its old code: close it and open it again (⌘T)
```

Opened by `mod.open:atd-launcher` (bound to `cmd-t` in `~/.config/herdr-app/keys.json`).
Config: `~/.config/atd-launcher/config.json` (optional, re-read on every open; its
`shortcut` is written into keys.json).
