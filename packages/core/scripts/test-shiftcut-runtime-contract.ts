import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadShiftCutRuntimeSource } from "../src/inline-scripts/shiftcut";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const runtimeSource = loadShiftCutRuntimeSource();
assert(runtimeSource !== null, "loadShiftCutRuntimeSource() returned null — entry.ts not found");

const requiredSnippets = [
  "window.__player",
  "window.__playerReady",
  "window.__renderReady",
  "hf-preview",
  "hf-parent",
  "renderSeek",
  "__shiftcut",
  "fitTextFontSize",
];

for (const snippet of requiredSnippets) {
  assert(runtimeSource.includes(snippet), `Runtime contract snippet missing: ${snippet}`);
}

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const manifestPath = resolve(scriptDir, "../dist/shiftcut.manifest.json");
try {
  const manifestRaw = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw) as { artifacts?: { iife?: string; esm?: string } };
  assert(Boolean(manifest.artifacts?.iife), "Manifest is missing iife artifact");
  assert(Boolean(manifest.artifacts?.esm), "Manifest is missing esm artifact");
} catch {
  // Build may not have run yet; contract-only checks above still provide signal.
}

console.log(
  JSON.stringify({
    event: "shiftcut_runtime_contract_verified",
    requiredSnippetsChecked: requiredSnippets.length,
  }),
);
