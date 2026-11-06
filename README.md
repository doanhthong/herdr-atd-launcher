# herdr-atd-launcher

A command palette mod (`atd-launcher`) for herdr-app, opened with ⌘T.

- What it does: [`docs/BEHAVIOR-SPEC-v2.md`](docs/BEHAVIOR-SPEC-v2.md) (source of truth)
- How to work on it: [`AGENTS.md`](AGENTS.md)

## Install

1. **Copy the mod** into herdr-app:
   ```sh
   git clone https://github.com/doanhthong/herdr-atd-launcher && cd herdr-atd-launcher
   ./scripts/sync.sh        # → ~/.config/herdr-app/mods/atd-launcher
   ```
2. **Add the shortcut**: in `~/.config/herdr-app/keys.json`, under `"global"`, add
   ```json
   "cmd-t": "mod.open:atd-launcher"
   ```
   This replaces herdr-app's ⌘T (new tab); pick another key if you want to keep it.
3. **Press ⌘T.** It works with no config file: Claude as the only command, three
   default quick actions, no saved spaces.

## Config (optional)

`~/.config/herdr-app/atd-launcher.json`, re-read every time the palette opens.
Most of it can be edited from the palette itself (Tab on a row, or Settings).

- Start from [`examples/atd-launcher.example.json`](examples/atd-launcher.example.json):
  ```sh
  cp examples/atd-launcher.example.json ~/.config/herdr-app/atd-launcher.json
  ```
  or use **Open config file** in the palette's settings, which creates it with the defaults.
- `shortcut` in this file wins: the palette writes it to `keys.json` each time it opens.
- Every field is described in [§8 of the spec](docs/BEHAVIOR-SPEC-v2.md#8-configuration-file).
