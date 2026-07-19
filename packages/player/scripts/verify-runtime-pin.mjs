#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const expected = `@shiftcut/core@${version}/dist/shiftcut.runtime.iife.js`;
const bundles = [
  "dist/shiftcut-player.js",
  "dist/shiftcut-player.cjs",
  "dist/shiftcut-player.global.js",
];

for (const bundle of bundles) {
  const source = readFileSync(join(root, bundle), "utf8");
  if (!source.includes(expected)) {
    throw new Error(`${bundle} does not pin the injected runtime to ${version}`);
  }
  if (source.includes("@shiftcut/core/dist/shiftcut.runtime.iife.js")) {
    throw new Error(`${bundle} still contains an unversioned runtime URL`);
  }
}

console.log(`Verified Player runtime injection is pinned to @shiftcut/core@${version}.`);
