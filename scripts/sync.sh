#!/bin/sh
# Copies mods/atd-launcher/ into herdr-app's mods folder (a symlink isn't watched, so hot
# reload needs real files there). `--watch` re-syncs on every save (needs fswatch).
set -e
cd "$(dirname "$0")/.."
DEST="${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/atd-launcher"
sync() {
  [ -L "$DEST" ] && rm "$DEST"
  mkdir -p "$DEST"
  rsync -a --delete --exclude gpui-kit.d.ts --exclude jsconfig.json mods/atd-launcher/ "$DEST/"
}
sync
echo "synced → $DEST"
if [ "$1" = "--watch" ]; then
  command -v fswatch >/dev/null || { echo "fswatch not installed (brew install fswatch)"; exit 1; }
  fswatch -o mods/atd-launcher | while read -r _; do sync; echo "synced $(date +%T)"; done
fi
