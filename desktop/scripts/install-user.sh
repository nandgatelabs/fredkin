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

# electron-builder names the binary from executableName / productName
BIN_NAME=""
for candidate in fredkin Fredkin fredkin-desktop money-money money-money-desktop; do
  if [[ -x "$UNPACKED/$candidate" ]]; then
    BIN_NAME="$candidate"
    break
  fi
done
if [[ -z "$BIN_NAME" ]]; then
  echo "No executable found in $UNPACKED" >&2
  exit 1
fi

SHARE_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/fredkin"
BIN_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/256x256/apps"

mkdir -p "$SHARE_DIR" "$BIN_DIR" "$APP_DIR" "$ICON_DIR"

rsync -a --delete "$UNPACKED/" "$SHARE_DIR/"
chmod +x "$SHARE_DIR/$BIN_NAME"

TARGET_BIN="$SHARE_DIR/$BIN_NAME"
WRAPPER="$BIN_DIR/fredkin"
cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
exec "$TARGET_BIN" "\$@"
EOF
chmod +x "$WRAPPER"

# Remove old FUSE-based AppImage / prior money-money wrappers if present.
rm -f "$BIN_DIR/fredkin.AppImage" "$BIN_DIR/money-money" "$BIN_DIR/money-money.AppImage"
rm -f "$APP_DIR/money-money.desktop"

if [[ -f "$ICON_SRC" ]]; then
  cp -f "$ICON_SRC" "$ICON_DIR/fredkin.png"
fi

DESKTOP_FILE="$APP_DIR/fredkin.desktop"
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=Fredkin
Comment=Offline personal finance tracker — Fredkin by NandGateLabs
Exec=$TARGET_BIN
Icon=fredkin
Terminal=false
Categories=Office;Finance;
StartupWMClass=Fredkin
EOF
chmod +x "$DESKTOP_FILE"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi

echo "Installed for user:"
echo "  launcher: $DESKTOP_FILE"
echo "  binary:   $TARGET_BIN"
echo "  wrapper:  $WRAPPER"
echo "  data:     \${XDG_CONFIG_HOME:-$HOME/.config}/Fredkin"
echo ""
echo "Open from your app grid as \"Fredkin\", or run:"
echo "  fredkin"
echo ""
echo "Note: AppImage needs libfuse2 on Ubuntu; this install uses the unpacked app instead."
echo "If you used the old money-money desktop build, ledger data may still be under"
echo "  ~/.config/money-money — copy it into ~/.config/Fredkin if needed."
