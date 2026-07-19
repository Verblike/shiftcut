import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  classifyVerblikeError,
  classifyVerblikeErrorCode,
  consumeVerblikeRemediation,
  flushVerblikeFailureTracking,
  VERBLIKE_NOT_AUTHENTICATED_MESSAGE,
  VERBLIKE_NOT_FOUND_MESSAGE,
  VERBLIKE_OUTDATED_MESSAGE,
  reportVerblikeFailure,
} from "./verblike-cli.mjs";

function captureFailureReport(err, context, trackEvent) {
  const originalError = console.error;
  const stderrCalls = [];
  console.error = (...args) => stderrCalls.push(args);
  try {
    if (trackEvent) {
      reportVerblikeFailure(err, context, trackEvent);
    } else {
      reportVerblikeFailure(err, context);
    }
  } finally {
    console.error = originalError;
  }
  return stderrCalls;
}

test("classifies ENOENT-style missing verblike errors with install instructions", () => {
  const message = classifyVerblikeError({ code: "ENOENT", message: "spawn verblike ENOENT" });

  assert.equal(message, VERBLIKE_NOT_FOUND_MESSAGE);
});

test("classifies auth failures with login instructions", () => {
  const message = classifyVerblikeError({ stderr: Buffer.from("Error: not logged in") });

  assert.equal(message, VERBLIKE_NOT_AUTHENTICATED_MESSAGE);
});

test("classifies a real 401 as auth, but not a bare 401 substring in prose", () => {
  assert.equal(
    classifyVerblikeError({ stderr: Buffer.from("HTTP 401 Unauthorized") }),
    VERBLIKE_NOT_AUTHENTICATED_MESSAGE,
  );
  // A request id that merely contains "401" must NOT read as an auth failure.
  const noise = classifyVerblikeError({ stderr: Buffer.from("upload failed (request req-401abc)") });
  assert.notEqual(noise, VERBLIKE_NOT_AUTHENTICATED_MESSAGE);
});

test("classifies old verblike versions with update instructions", () => {
  const message = classifyVerblikeError({
    stderr: Buffer.from("verblike v0.1.5 does not support --headers"),
  });

  assert.equal(message, VERBLIKE_OUTDATED_MESSAGE);
});

test("does not misclassify a resource 'not found' error as a missing CLI", () => {
  // A stale voiceId makes `verblike voice speech create` fail with "voice not
  // found"; the error message embeds the `verblike ...` command line. This must
  // pass through as detail, not send the user to reinstall a working CLI.
  const message = classifyVerblikeError({
    stderr: Buffer.from("Error: voice not found (id: stale-123)"),
    message: "Command failed: verblike voice speech create --voice stale-123",
  });

  assert.notEqual(message, VERBLIKE_NOT_FOUND_MESSAGE);
  assert.equal(message, "Error: voice not found (id: stale-123)");
});

test("classifies a shell 'command not found' as a missing CLI", () => {
  const message = classifyVerblikeError({ stderr: Buffer.from("bash: verblike: command not found") });

  assert.equal(message, VERBLIKE_NOT_FOUND_MESSAGE);
});

test("passes through unrelated errors", () => {
  const message = classifyVerblikeError({
    stderr: Buffer.from("rate limit exceeded"),
    message: "Command failed",
  });

  assert.equal(message, "rate limit exceeded");
});

test("classifies existing Verblike failures with stable reason codes", () => {
  assert.equal(classifyVerblikeErrorCode({ code: "ENOENT" }), "not_found");
  assert.equal(
    classifyVerblikeErrorCode({ stderr: Buffer.from("HTTP 401 Unauthorized") }),
    "not_authenticated",
  );
  assert.equal(
    classifyVerblikeErrorCode({ stderr: Buffer.from("verblike v0.1.5 is unsupported") }),
    "outdated",
  );
  assert.equal(classifyVerblikeErrorCode({ stderr: Buffer.from("provider unavailable") }), "other");
});

test("classifies rate-limit text case-insensitively", () => {
  assert.equal(
    classifyVerblikeErrorCode({ stderr: Buffer.from("RATE LIMIT exceeded") }),
    "rate_limited",
  );
});

test("classifies quota and insufficient-credit errors as rate limited", () => {
  for (const detail of ["Quota exhausted", "INSUFFICIENT CREDIT remaining"]) {
    assert.equal(classifyVerblikeErrorCode({ stderr: Buffer.from(detail) }), "rate_limited");
  }
});

test("classifies the literal 429 reason phrase and throttling language as rate limited", () => {
  for (const detail of ["Too Many Requests", "Error: throttled by upstream, retry later"]) {
    assert.equal(classifyVerblikeErrorCode({ stderr: Buffer.from(detail) }), "rate_limited");
  }
});

test("does not misclassify unrelated errors that share a word with the new phrasing", () => {
  // Shares "too many" with "too many requests" but is a distinct failure (fd
  // exhaustion, not a rate limit) — the match must require the full phrase.
  assert.equal(
    classifyVerblikeErrorCode({ stderr: Buffer.from("Too many open file descriptors") }),
    "other",
  );
});

test("classifies a bare 429 as rate limited without matching request IDs", () => {
  assert.equal(
    classifyVerblikeErrorCode({ stderr: Buffer.from("HTTP 429 Too Many Requests") }),
    "rate_limited",
  );
  assert.equal(
    classifyVerblikeErrorCode({ stderr: Buffer.from("request req-429abc failed") }),
    "other",
  );
});

test("tracks not-found failures without changing actionable output", () => {
  const trackingCalls = [];
  const stderrCalls = captureFailureReport({ code: "ENOENT" }, "verblike asset search", (...args) =>
    trackingCalls.push(args),
  );

  assert.deepEqual(stderrCalls, [[VERBLIKE_NOT_FOUND_MESSAGE]]);
  assert.deepEqual(trackingCalls, [
    ["media_use_provider_error", { provider: "verblike", reason: "not_found" }],
  ]);
});

test("records missing and outdated CLI remediation once", () => {
  consumeVerblikeRemediation();
  captureFailureReport({ code: "ENOENT" }, "verblike audio sounds list", () => {});
  assert.deepEqual(consumeVerblikeRemediation(), {
    code: "not_found",
    message: VERBLIKE_NOT_FOUND_MESSAGE,
  });
  assert.equal(consumeVerblikeRemediation(), null);

  captureFailureReport(
    { stderr: Buffer.from("verblike v0.1.5 does not support --headers") },
    "verblike audio sounds list",
    () => {},
  );
  assert.deepEqual(consumeVerblikeRemediation(), {
    code: "outdated",
    message: VERBLIKE_OUTDATED_MESSAGE,
  });
  assert.equal(consumeVerblikeRemediation(), null);
});

test("does not record non-install remediation", () => {
  consumeVerblikeRemediation();
  for (const error of [
    { stderr: Buffer.from("HTTP 401 Unauthorized") },
    { stderr: Buffer.from("quota exhausted") },
    { stderr: Buffer.from("provider unavailable") },
  ]) {
    captureFailureReport(error, "verblike audio sounds list", () => {});
    assert.equal(consumeVerblikeRemediation(), null);
  }
});

test("tracks generic failures without including raw detail", () => {
  const trackingCalls = [];
  const stderrCalls = captureFailureReport(
    { stderr: Buffer.from("private provider detail") },
    "verblike asset search",
    (...args) => trackingCalls.push(args),
  );

  assert.deepEqual(stderrCalls, [
    ["media-use: `verblike asset search` failed: private provider detail"],
  ]);
  assert.deepEqual(trackingCalls, [
    ["media_use_provider_error", { provider: "verblike", reason: "other" }],
  ]);
});

test("keeps failure output observable when telemetry is opted out", () => {
  const previousOptOut = process.env.SHIFTCUT_NO_TELEMETRY;
  process.env.SHIFTCUT_NO_TELEMETRY = "1";
  try {
    const stderrCalls = captureFailureReport({ code: "ENOENT" }, "verblike asset search");

    assert.deepEqual(stderrCalls, [[VERBLIKE_NOT_FOUND_MESSAGE]]);
  } finally {
    if (previousOptOut === undefined) {
      delete process.env.SHIFTCUT_NO_TELEMETRY;
    } else {
      process.env.SHIFTCUT_NO_TELEMETRY = previousOptOut;
    }
  }
});

test("keeps failure output observable when tracking throws synchronously", () => {
  const originalError = console.error;
  const stderrCalls = [];
  let thrown;
  console.error = (...args) => stderrCalls.push(args);
  try {
    try {
      reportVerblikeFailure({ code: "ENOENT" }, "verblike asset search", () => {
        throw new Error("tracking failed");
      });
    } catch (err) {
      thrown = err;
    }
  } finally {
    console.error = originalError;
  }

  assert.deepEqual(stderrCalls, [[VERBLIKE_NOT_FOUND_MESSAGE]]);
  assert.equal(thrown, undefined);
});

test("does not leave rejected tracking promises unhandled", () => {
  const moduleUrl = new URL("./verblike-cli.mjs", import.meta.url).href;
  const script = `
    import { reportVerblikeFailure } from ${JSON.stringify(moduleUrl)};
    reportVerblikeFailure(
      { stderr: "provider unavailable" },
      "verblike asset search",
      () => Promise.reject(new Error("tracking failed")),
    );
    await new Promise((resolve) => setImmediate(resolve));
  `;
  const child = spawnSync(
    process.execPath,
    ["--unhandled-rejections=strict", "--input-type=module", "--eval", script],
    { encoding: "utf8", timeout: 5000 },
  );

  assert.equal(child.error, undefined);
  assert.equal(child.signal, null);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stderr, "media-use: `verblike asset search` failed: provider unavailable\n");
});

test("flushVerblikeFailureTracking waits for a pending report before resolving", async () => {
  const events = [];
  let releaseTrack;
  const gate = new Promise((resolve) => {
    releaseTrack = resolve;
  });

  // Mirrors the real call sites (voice-provider.mjs, verblike-search.mjs):
  // fire-and-forget, the return value is never awaited by the caller.
  reportVerblikeFailure({ code: "ENOENT" }, "verblike voice speech", () =>
    gate.then(() => {
      events.push("track-settled");
    }),
  );

  const flushed = flushVerblikeFailureTracking().then(() => {
    events.push("flush-resolved");
  });

  // Let several pending microtasks drain before releasing the gate, so this
  // proves flush is genuinely still waiting on the tracked promise -- not
  // merely that it hasn't had a tick yet.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(events, [], "flush must not resolve while the tracked promise is still pending");

  releaseTrack();
  await flushed;

  assert.deepEqual(
    events,
    ["track-settled", "flush-resolved"],
    "flush must resolve only after the pending track settles, in that order",
  );
});

test("flushVerblikeFailureTracking resolves immediately when nothing is pending", async () => {
  await flushVerblikeFailureTracking();
});
