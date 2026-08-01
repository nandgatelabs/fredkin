#!/usr/bin/env node
/**
 * Print the CHANGELOG section for a version (e.g. 1.0.0) to stdout.
 * Usage: node scripts/extract-changelog.mjs 1.0.0
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/extract-changelog.mjs <X.Y.Z>");
  process.exit(1);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const text = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
const heading = `## [${version}]`;
const start = text.indexOf(heading);
if (start < 0) {
  console.error(`No CHANGELOG section for ${version}`);
  process.exit(1);
}
const rest = text.slice(start);
const next = rest.search(/\n## \[/);
const section = (next >= 0 ? rest.slice(0, next) : rest).trimEnd() + "\n";
process.stdout.write(section);
