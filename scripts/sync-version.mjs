#!/usr/bin/env node
/**
 * Keep package.json, app.json, and desktop/package.json versions aligned.
 *
 *   node scripts/sync-version.mjs           # sync from root package.json
 *   node scripts/sync-version.mjs 1.2.0     # set root then sync
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const semver = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const rootPkgPath = path.join(root, "package.json");
const appJsonPath = path.join(root, "app.json");
const desktopPkgPath = path.join(root, "desktop", "package.json");

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
const arg = process.argv[2];

if (arg) {
  if (!semver.test(arg)) {
    console.error(`Invalid version: ${arg} (expected MAJOR.MINOR.PATCH)`);
    process.exit(1);
  }
  rootPkg.version = arg;
  fs.writeFileSync(rootPkgPath, `${JSON.stringify(rootPkg, null, 2)}\n`);
}

const version = rootPkg.version;
if (!semver.test(version)) {
  console.error(`Root package.json has invalid version: ${version}`);
  process.exit(1);
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
appJson.expo.version = version;
fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

const desktopPkg = JSON.parse(fs.readFileSync(desktopPkgPath, "utf8"));
desktopPkg.version = version;
fs.writeFileSync(desktopPkgPath, `${JSON.stringify(desktopPkg, null, 2)}\n`);

console.log(`Synced version ${version} → package.json, app.json, desktop/package.json`);
