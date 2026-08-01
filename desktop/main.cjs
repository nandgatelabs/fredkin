/**
 * Electron shell for Fredkin.
 *
 * Serves the Expo static web export (../dist) over loopback HTTP with the
 * COOP/COEP headers expo-sqlite (OPFS) needs. file:// is intentionally avoided.
 *
 * Port and userData are fixed so Chromium origin / OPFS persist across launches
 * (random ports previously wiped "the database" every restart).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, dialog } = require("electron");

const COEP = "credentialless";
const COOP = "same-origin";
/** Stable origin: http://127.0.0.1:47821 — override with DESKTOP_PORT */
const APP_PORT = Number(process.env.DESKTOP_PORT || 47821);
const PROFILE = "Fredkin";
const LEGACY_PROFILE = "money-money";

// Optional on headless / broken GPU hosts: DESKTOP_NO_GPU=1 npm run desktop:dev
if (process.env.DESKTOP_NO_GPU === "1") {
  app.disableHardwareAcceleration();
}

// Same profile for `desktop:dev` and packaged builds → data survives both.
// One-time: reuse legacy money-money profile if Fredkin profile is absent.
app.setName("Fredkin");
{
  const appData = app.getPath("appData");
  const nextPath = path.join(appData, PROFILE);
  const legacyPath = path.join(appData, LEGACY_PROFILE);
  const profilePath =
    !fs.existsSync(nextPath) && fs.existsSync(legacyPath) ? legacyPath : nextPath;
  app.setPath("userData", profilePath);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

let mainWindow = null;

function distDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "dist");
  }
  return path.join(__dirname, "..", "dist");
}

function setIsolationHeaders(res) {
  res.setHeader("Cross-Origin-Embedder-Policy", COEP);
  res.setHeader("Cross-Origin-Opener-Policy", COOP);
  res.setHeader("Cache-Control", "no-cache");
}

function safeResolve(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const rel = decoded.replace(/^\/+/, "");
  const abs = path.normalize(path.join(root, rel));
  if (!abs.startsWith(root)) return null;
  return abs;
}

function tryCandidates(root, urlPath) {
  const base = safeResolve(root, urlPath === "/" ? "/index.html" : urlPath);
  if (!base) return null;

  const candidates = [base, `${base}.html`, path.join(base, "index.html")];

  if (urlPath !== "/" && !path.extname(base)) {
    candidates.push(path.join(root, urlPath.replace(/^\/+/, "") + ".html"));
  }

  for (const file of candidates) {
    try {
      if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
    } catch {
      // ignore
    }
  }

  const fallback = path.join(root, "index.html");
  if (fs.existsSync(fallback)) return fallback;
  return null;
}

function createStaticServer(root) {
  return http.createServer((req, res) => {
    setIsolationHeaders(res);

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }

    const file = tryCandidates(root, req.url || "/");
    if (!file) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Fredkin desktop: dist not found or incomplete. Run npm run web:export");
      return;
    }

    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(file).pipe(res);
  });
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(port));
  });
}

function focusMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    backgroundColor: "#2C2B27",
    title: "Fredkin",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (process.env.DESKTOP_DEV === "1") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  return mainWindow;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    focusMainWindow();
  });

  app
    .whenReady()
    .then(async () => {
      const root = distDir();
      if (!fs.existsSync(path.join(root, "index.html"))) {
        dialog.showErrorBox(
          "Fredkin desktop",
          `Missing web export at:\n${root}\n\nFrom the repo root run:\n  npm run web:export\n  npm run desktop:dev`
        );
        app.quit();
        return;
      }

      const server = createStaticServer(root);
      try {
        await listen(server, APP_PORT);
      } catch (err) {
        dialog.showErrorBox(
          "Fredkin desktop",
          `Could not bind 127.0.0.1:${APP_PORT}.\n` +
            `Another process may be using it (or an old Fredkin window).\n\n${err}`
        );
        app.quit();
        return;
      }

      app.on("quit", () => {
        server.close();
      });

      await createWindow(APP_PORT);

      app.on("activate", async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          await createWindow(APP_PORT);
        }
      });
    })
    .catch((err) => {
      dialog.showErrorBox("Fredkin desktop", String(err?.stack || err));
      app.quit();
    });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
