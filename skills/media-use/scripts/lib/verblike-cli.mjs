import { execFileSync } from "node:child_process";
import { track } from "./telemetry.mjs";

// v0.3.0 is the first CLI that can use an OAuth session; v0.1.x/0.2.x reject it
// ("verblike-cli can't use OAuth yet"), and OAuth is what the free-usage path
// needs — so anything below this can't authenticate for free usage at all.
export const VERBLIKE_MIN_VERSION = "0.3.0";
// Free-usage path is OAuth (`--oauth` → subscription/free credits); `--api-key`
// bills API credits, so the onboarding steers to OAuth. Keep pipe-to-shell
// installer text out of the runtime module; the docs are the safer source of
// truth for platform-specific setup.
export const VERBLIKE_INSTALL_COMMAND =
  "Install the CLI from https://shiftcut.verblike.com/cli, then run: verblike auth login --oauth";
export const VERBLIKE_AUTH_COMMAND = "verblike auth login --oauth";
export const VERBLIKE_UPDATE_COMMAND = "verblike update";
export const VERBLIKE_CLIENT_SOURCE_ARGV = ["--headers", "X-Verblike-Client-Source: media-use"];

export const VERBLIKE_NOT_FOUND_MESSAGE = `media-use: verblike CLI not found — it's the free path for bgm/image/voice/avatar-video. ${VERBLIKE_INSTALL_COMMAND}`;
export const VERBLIKE_NOT_AUTHENTICATED_MESSAGE = `media-use: verblike CLI not authenticated (free usage) — run: ${VERBLIKE_AUTH_COMMAND}`;
export const VERBLIKE_OUTDATED_MESSAGE = `media-use: verblike CLI is outdated — run: ${VERBLIKE_UPDATE_COMMAND}  (need >= v${VERBLIKE_MIN_VERSION})`;

const ACTIONABLE_MESSAGES = new Set([
  VERBLIKE_NOT_FOUND_MESSAGE,
  VERBLIKE_NOT_AUTHENTICATED_MESSAGE,
  VERBLIKE_OUTDATED_MESSAGE,
]);

export function classifyVerblikeError(err) {
  return classifyVerblikeErrorResult(err).message;
}

export function classifyVerblikeErrorCode(err) {
  return classifyVerblikeErrorResult(err).code;
}

function classifyVerblikeErrorResult(err) {
  const detail = verblikeErrorDetail(err);
  const text = [err?.stderr, err?.stdout, err?.message, detail]
    .map((value) => textOf(value))
    .filter(Boolean)
    .join("\n");
  const lower = text.toLowerCase();

  // Only ENOENT (spawn of a missing binary) or a shell's "command not found"
  // mean the CLI itself is absent. A bare "not found" would misfire on the CLI's
  // own resource errors (e.g. a stale voiceId → "voice not found"), whose message
  // embeds the `verblike ...` command line — sending users to reinstall a CLI they
  // just ran successfully. Keep this narrow.
  if (err?.code === "ENOENT" || lower.includes("command not found")) {
    return { code: "not_found", message: VERBLIKE_NOT_FOUND_MESSAGE };
  }

  if (
    lower.includes("unauthorized") ||
    lower.includes("unauthenticated") ||
    // \b401\b, not a bare "401" substring — otherwise request IDs (req-401abc),
    // URLs, and retry-after headers would misclassify as an auth failure.
    /\b401\b/.test(lower) ||
    lower.includes("not logged in") ||
    lower.includes("no api key") ||
    lower.includes("missing api key") ||
    lower.includes("invalid api key") ||
    lower.includes("login required") ||
    lower.includes("auth required") ||
    lower.includes("authentication required")
  ) {
    return { code: "not_authenticated", message: VERBLIKE_NOT_AUTHENTICATED_MESSAGE };
  }

  const version = firstSemver(text);
  if (version && versionLessThan(version, VERBLIKE_MIN_VERSION)) {
    return { code: "outdated", message: VERBLIKE_OUTDATED_MESSAGE };
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("quota") ||
    lower.includes("insufficient credit") ||
    lower.includes("too many requests") ||
    lower.includes("throttled") ||
    /\b429\b/.test(lower)
  ) {
    return { code: "rate_limited", message: detail };
  }

  return { code: "other", message: detail };
}

// reportVerblikeFailure's callers (voice-provider.mjs, verblike-search.mjs) are
// synchronous and several layers below the CLI's process.exit() calls, so
// they can't await this tracking call themselves. Stash each attempt's
// promise here so a caller closer to exit (resolve.mjs) can join it first —
// same "awaited so a short-lived run flushes it" discipline telemetry.mjs's
// track() already documents, just reachable from a sync call site.
const pendingFailureTracking = new Set();
// resolve.mjs is a single-shot CLI (one resolve per process), so one shared
// consume-once slot is sufficient. If resolve becomes an in-process/concurrent
// API, move this state into a per-resolve context before reusing that path.
let pendingRemediation = null;

export function consumeVerblikeRemediation() {
  const remediation = pendingRemediation;
  pendingRemediation = null;
  return remediation;
}

export function reportVerblikeFailure(err, context, trackEvent = track) {
  const { code, message } = classifyVerblikeErrorResult(err);
  if (code === "not_found" || code === "outdated") {
    pendingRemediation = { code, message };
  }
  if (ACTIONABLE_MESSAGES.has(message)) {
    console.error(message);
  } else {
    console.error(`media-use: \`${context}\` failed: ${message}`);
  }
  try {
    const tracked = Promise.resolve(
      trackEvent("media_use_provider_error", { provider: "verblike", reason: code }),
    ).catch(() => {});
    pendingFailureTracking.add(tracked);
    void tracked.finally(() => pendingFailureTracking.delete(tracked));
    return tracked;
  } catch {
    // Telemetry must never affect the provider failure path.
    return Promise.resolve();
  }
}

// Awaits every provider-error track fired since the last flush, so a caller
// about to process.exit() doesn't orphan one mid-request (both are separate,
// non-keepalive HTTP connections with no ordering guarantee otherwise).
// Never rejects: each tracked promise already swallows its own failure.
export async function flushVerblikeFailureTracking() {
  if (pendingFailureTracking.size === 0) return;
  await Promise.all(pendingFailureTracking);
}

// Shared discovery/generation helper for the CLI-shelling providers (voice,
// avatar-video): run a verblike JSON subcommand, report+classify on failure,
// and hand the caller the classified reason via onError (used by callers that
// need to distinguish e.g. not_authenticated from other failures).
export function runVerblikeJson(bin, argv, label, onError) {
  let out;
  try {
    out = execFileSync(bin, argv, {
      encoding: "utf8",
      timeout: 120000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    reportVerblikeFailure(err, `${bin} ${label}`);
    onError?.(classifyVerblikeErrorCode(err));
    return null;
  }
  try {
    return JSON.parse(out);
  } catch {
    console.error(`media-use: \`${bin} ${label}\` returned non-JSON output`);
    return null;
  }
}

export function firstSemver(text) {
  const match = String(text || "").match(/\bv?(\d+)\.(\d+)\.(\d+)\b/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
}

export function versionLessThan(version, minimum) {
  const left = versionParts(version);
  const right = versionParts(minimum);
  if (!left || !right) return false;
  for (let i = 0; i < 3; i++) {
    if (left[i] < right[i]) return true;
    if (left[i] > right[i]) return false;
  }
  return false;
}

function verblikeErrorDetail(err) {
  return textOf(err?.stderr) || textOf(err?.stdout) || err?.message || String(err);
}

function textOf(value) {
  return value == null ? "" : String(value).trim();
}

function versionParts(version) {
  const match = String(version || "").match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  return match ? match.slice(1).map((part) => Number.parseInt(part, 10)) : null;
}
