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
3. **Create your config** (recommended) from the example, then edit its spaces and commands:
   ```sh
   cp examples/atd-launcher.example.json ~/.config/herdr-app/atd-launcher.json
   ```
   Add the spaces you've opened recently in herdr-app to `spaces` (or use
   **+ Add space…** in the palette's Settings), so they're one search away even when closed.
4. **Press ⌘T.**

## Config

`~/.config/herdr-app/atd-launcher.json`, re-read every time the palette opens.
Most of it can also be edited from the palette itself (Tab on a row, or Settings).

- Start from [`examples/atd-launcher.example.json`](examples/atd-launcher.example.json),
  or use **Open config file** in the palette's settings, which creates it with the defaults.
- The example's **Open in Zed** / **Open in VS Code** open the chosen space's folder
  (pick the space, or ⌘Enter for the current one). The editor opens in its own window; the
  new tab is left with a shell in that folder. ⌘⇧Enter runs it in the current terminal instead.
- Without a config the palette still runs: Claude as the only command, three default
  quick actions, no saved spaces.
- `shortcut` in this file wins: the palette writes it to `keys.json` each time it opens.
- Every field is described in [§8 of the spec](docs/BEHAVIOR-SPEC-v2.md#8-configuration-file).
