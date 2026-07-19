/**
 * Browser-safe entry for @shiftcut/lint.
 *
 * Exposes the composition rule engine — HTML-string in, findings out — with
 * **zero Node.js dependencies**: no `node:fs`, no filesystem, no server. This
 * lets browser-only editors and tools validate compositions entirely
 * client-side, before any network call.
 *
 * The Node-only project layer (`lintProject`, which walks a directory) is NOT
 * exported here — import it from the main `@shiftcut/lint` entry in Node.
 */
export type {
  ShiftCutLintSeverity,
  ShiftCutLintFinding,
  ShiftCutLintResult,
  ShiftCutLinterOptions,
} from "./types.js";
export { lintShiftCutHtml, lintMediaUrls } from "./shiftcutLinter.js";
export { shouldBlockRender } from "./shouldBlockRender.js";
