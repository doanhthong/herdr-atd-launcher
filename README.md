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
4. **Press ⌘T.**

## Config

`~/.config/herdr-app/atd-launcher.json`, re-read every time the palette opens.
Most of it can also be edited from the palette itself (Tab on a row, or Settings).

- Start from [`examples/atd-launcher.example.json`](examples/atd-launcher.example.json),
  or use **Open config file** in the palette's settings, which creates it with the defaults.
- Without a config the palette still runs: Claude as the only command, three default
  quick actions, no saved spaces.
- `shortcut` in this file wins: the palette writes it to `keys.json` each time it opens.
- Every field is described in [§8 of the spec](docs/BEHAVIOR-SPEC-v2.md#8-configuration-file).
