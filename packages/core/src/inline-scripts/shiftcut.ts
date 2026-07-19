import { buildShiftcutRuntimeScript } from "./shiftcutRuntime.engine";
import { SHIFTCUT_BRIDGE_SOURCES, SHIFTCUT_RUNTIME_GLOBALS } from "./runtimeContract";

export const SHIFTCUT_RUNTIME_ARTIFACTS = {
  iife: "shiftcut.runtime.iife.js",
  esm: "shiftcut.runtime.mjs",
  manifest: "shiftcut.manifest.json",
} as const;

export type ShiftCutRuntimeContract = {
  globals: typeof SHIFTCUT_RUNTIME_GLOBALS;
  messageSources: typeof SHIFTCUT_BRIDGE_SOURCES;
};

export const SHIFTCUT_RUNTIME_CONTRACT: ShiftCutRuntimeContract = {
  globals: SHIFTCUT_RUNTIME_GLOBALS,
  messageSources: SHIFTCUT_BRIDGE_SOURCES,
};

export function loadShiftCutRuntimeSource(): string | null {
  return buildShiftcutRuntimeScript();
}
