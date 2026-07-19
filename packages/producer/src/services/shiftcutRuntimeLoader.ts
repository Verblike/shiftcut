import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCER_DIR = dirname(fileURLToPath(import.meta.url));
const SIBLING_MANIFEST_PATH = resolve(PRODUCER_DIR, "shiftcut.manifest.json");
const MODULE_RELATIVE_MANIFEST_PATH = resolve(
  PRODUCER_DIR,
  "../../../core/dist/shiftcut.manifest.json",
);
const CWD_RELATIVE_MANIFEST_PATHS = [
  // When bundled to a single file (dist/public-server.js), the manifest
  // is copied as a sibling by build.mjs
  resolve(PRODUCER_DIR, "shiftcut.manifest.json"),
  resolve(process.cwd(), "packages/core/dist/shiftcut.manifest.json"),
  resolve(process.cwd(), "../core/dist/shiftcut.manifest.json"),
  resolve(process.cwd(), "core/dist/shiftcut.manifest.json"),
];

type ShiftCutRuntimeManifest = {
  sha256?: string;
  artifacts?: {
    iife?: string;
  };
};

export type ResolvedShiftCutRuntime = {
  manifestPath: string;
  runtimePath: string;
  expectedSha256: string;
  actualSha256: string;
  runtimeSource: string;
};

export function resolveShiftCutManifestPath(): string {
  if (process.env.PRODUCER_SHIFTCUT_MANIFEST_PATH) {
    return process.env.PRODUCER_SHIFTCUT_MANIFEST_PATH;
  }
  const candidates = [
    SIBLING_MANIFEST_PATH,
    ...CWD_RELATIVE_MANIFEST_PATHS,
    MODULE_RELATIVE_MANIFEST_PATH,
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return MODULE_RELATIVE_MANIFEST_PATH;
}

export function getVerifiedShiftCutRuntimeSource(): string {
  return resolveVerifiedShiftCutRuntime().runtimeSource;
}

export function resolveVerifiedShiftCutRuntime(): ResolvedShiftCutRuntime {
  const manifestPath = resolveShiftCutManifestPath();
  if (!existsSync(manifestPath)) {
    throw new Error(
      `[ShiftCutRuntimeLoader] Missing manifest at ${manifestPath}. Build core runtime artifacts before rendering.`,
    );
  }

  const manifestRaw = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw) as ShiftCutRuntimeManifest;
  const runtimeFileName = manifest.artifacts?.iife;
  if (!runtimeFileName || !manifest.sha256) {
    throw new Error(
      `[ShiftCutRuntimeLoader] Invalid manifest at ${manifestPath}; missing iife artifact or sha256.`,
    );
  }

  const runtimePath = resolve(dirname(manifestPath), runtimeFileName);
  if (!existsSync(runtimePath)) {
    throw new Error(`[ShiftCutRuntimeLoader] Missing runtime artifact at ${runtimePath}.`);
  }

  const runtimeSource = readFileSync(runtimePath, "utf8");
  const runtimeSha = createHash("sha256").update(runtimeSource, "utf8").digest("hex");
  if (runtimeSha !== manifest.sha256) {
    throw new Error(
      `[ShiftCutRuntimeLoader] Runtime checksum mismatch. expected=${manifest.sha256} actual=${runtimeSha}`,
    );
  }
  return {
    manifestPath,
    runtimePath,
    expectedSha256: manifest.sha256,
    actualSha256: runtimeSha,
    runtimeSource,
  };
}
