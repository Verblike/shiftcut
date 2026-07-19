#!/usr/bin/env node

// pnpm and yarn fold `publishConfig.main/types/exports` into the top-level
// fields when packing. npm and bun do not — they only read `publishConfig`
// for `access`, `registry`, and `tag`. This repo publishes with bun, and its
// packages point `main`/`types`/`exports` at `src/*.ts` for local development
// while shipping only `dist` in `files`, so without this substitution the
// published manifests resolve to TypeScript that is not in the tarball.
//
// Run after `bun run build` and before packing or publishing. Rewrites each
// workspace package.json in place, so run it on a throwaway checkout (CI) or
// restore the tree afterwards. Idempotent.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const PACKAGES_DIR = join(ROOT, "packages");
const SUBSTITUTED_FIELDS = ["main", "module", "types", "typings", "exports", "bin"];

function listWorkspacePackageDirs() {
  return readdirSync(PACKAGES_DIR)
    .map((dir) => join(PACKAGES_DIR, dir))
    .filter((dir) => existsSync(join(dir, "package.json")));
}

export function applyPublishConfig(pkg) {
  const publishConfig = pkg.publishConfig;
  if (!publishConfig) return { pkg, applied: [] };

  const applied = SUBSTITUTED_FIELDS.filter((field) => field in publishConfig);
  if (applied.length === 0) return { pkg, applied: [] };

  const next = { ...pkg };
  for (const field of applied) {
    next[field] = publishConfig[field];
  }

  // Leave the registry-level keys (access/registry/tag) for the publish client.
  const remaining = { ...publishConfig };
  for (const field of applied) {
    delete remaining[field];
  }
  if (Object.keys(remaining).length > 0) {
    next.publishConfig = remaining;
  } else {
    delete next.publishConfig;
  }

  return { pkg: next, applied };
}

function applyToWorkspace(packageDir) {
  const manifestPath = join(packageDir, "package.json");
  const source = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (source.private) return false;

  const { pkg, applied } = applyPublishConfig(source);
  if (applied.length === 0) return false;

  writeFileSync(manifestPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`Applied publishConfig for ${source.name}: ${applied.join(", ")}`);
  return true;
}

function main() {
  const changed = listWorkspacePackageDirs().filter(applyToWorkspace);
  console.log(`Applied publishConfig substitution to ${changed.length} package(s).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
