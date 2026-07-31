#!/usr/bin/env bash
# Install unpacked Electron app + .desktop launcher for the current user (no sudo).
# Uses linux-unpacked (not AppImage) so Ubuntu without libfuse2 can still launch.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RELEASE="$ROOT/desktop/release"
UNPACKED="$RELEASE/linux-unpacked"
ICON_SRC="$ROOT/assets/images/icon.png"

if [[ ! -d "$UNPACKED" ]]; then
  echo "Missing $UNPACKED — run: npm run desktop:pack" >&2
  exit 1
fi

# electron-builder names the binary from package.json "name"
BIN_NAME=""
for candidate in money-money money-money-desktop; do
  if [[ -x "$UNPACKED/$candidate" ]]; then
    BIN_NAME="$candidate"
    break
  fi
done
if [[ -z "$BIN_NAME" ]]; then
  echo "No executable found in $UNPACKED" >&2
  exit 1
fi

SHARE_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/money-money"
BIN_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/256x256/apps"

mkdir -p "$SHARE_DIR" "$BIN_DIR" "$APP_DIR" "$ICON_DIR"

rsync -a --delete "$UNPACKED/" "$SHARE_DIR/"
chmod +x "$SHARE_DIR/$BIN_NAME"

TARGET_BIN="$SHARE_DIR/$BIN_NAME"
WRAPPER="$BIN_DIR/money-money"
cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
exec "$TARGET_BIN" "\$@"
EOF
chmod +x "$WRAPPER"

# Remove old FUSE-based AppImage install if present (it fails without libfuse2).
rm -f "$BIN_DIR/money-money.AppImage"

if [[ -f "$ICON_SRC" ]]; then
  cp -f "$ICON_SRC" "$ICON_DIR/money-money.png"
fi

DESKTOP_FILE="$APP_DIR/money-money.desktop"
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=money-money
Comment=Offline personal finance tracker
Exec=$TARGET_BIN
Icon=money-money
Terminal=false
Categories=Office;Finance;
StartupWMClass=money-money
EOF
chmod +x "$DESKTOP_FILE"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi

echo "Installed for user:"
echo "  launcher: $DESKTOP_FILE"
echo "  binary:   $TARGET_BIN"
echo "  wrapper:  $WRAPPER"
echo "  data:     \${XDG_CONFIG_HOME:-$HOME/.config}/money-money"
echo ""
echo "Open from your app grid as \"money-money\", or run:"
echo "  money-money"
echo ""
echo "Note: AppImage needs libfuse2 on Ubuntu; this install uses the unpacked app instead."
