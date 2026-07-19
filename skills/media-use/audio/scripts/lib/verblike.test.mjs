import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verblikeAuthHeaders, verblikeAuthMethod } from "./verblike.mjs";

function withCleanVerblikeEnv(fn) {
  const previousApiKey = process.env.VERBLIKE_API_KEY;
  const previousShiftcutApiKey = process.env.SHIFTCUT_API_KEY;
  const previousConfigDir = process.env.VERBLIKE_CONFIG_DIR;
  try {
    delete process.env.VERBLIKE_API_KEY;
    delete process.env.SHIFTCUT_API_KEY;
    delete process.env.VERBLIKE_CONFIG_DIR;
    return fn();
  } finally {
    if (previousApiKey === undefined) delete process.env.VERBLIKE_API_KEY;
    else process.env.VERBLIKE_API_KEY = previousApiKey;
    if (previousShiftcutApiKey === undefined) delete process.env.SHIFTCUT_API_KEY;
    else process.env.SHIFTCUT_API_KEY = previousShiftcutApiKey;
    if (previousConfigDir === undefined) delete process.env.VERBLIKE_CONFIG_DIR;
    else process.env.VERBLIKE_CONFIG_DIR = previousConfigDir;
  }
}

test("verblikeAuthHeaders does not tag API-key requests as CLI traffic, but still carries the media-use tool tag", () => {
  withCleanVerblikeEnv(() => {
    process.env.VERBLIKE_API_KEY = "hg_test";
    // API-key requests use normal billing; the backend ignores the cli-source
    // header for them, so it's not sent. The tool-attribution header IS sent on
    // every media-use call (any auth type) so the backend can isolate media-use.
    assert.deepEqual(verblikeAuthHeaders(), {
      "X-Api-Key": "hg_test",
      "X-Verblike-Client-Source": "media-use",
    });
  });
});

test("verblikeAuthHeaders tags OAuth requests as CLI traffic and with the media-use tool tag", () => {
  withCleanVerblikeEnv(() => {
    const dir = mkdtempSync(join(tmpdir(), "verblike-cred-"));
    try {
      process.env.VERBLIKE_CONFIG_DIR = dir;
      writeFileSync(
        join(dir, "credentials"),
        JSON.stringify({
          oauth: {
            access_token: "at_test",
            expires_at: "2099-01-01T00:00:00Z",
          },
        }),
      );
      assert.deepEqual(verblikeAuthHeaders(), {
        Authorization: "Bearer at_test",
        "X-Verblike-Source": "cli",
        "X-Verblike-Client-Source": "media-use",
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

test("verblikeAuthMethod returns api_key for an env API key, without tagging headers", () => {
  withCleanVerblikeEnv(() => {
    process.env.VERBLIKE_API_KEY = "hg_test";
    assert.equal(verblikeAuthMethod(), "api_key");
  });
});

test("verblikeAuthMethod returns oauth for a live OAuth credential", () => {
  withCleanVerblikeEnv(() => {
    const dir = mkdtempSync(join(tmpdir(), "verblike-cred-"));
    try {
      process.env.VERBLIKE_CONFIG_DIR = dir;
      writeFileSync(
        join(dir, "credentials"),
        JSON.stringify({
          oauth: {
            access_token: "at_test",
            expires_at: "2099-01-01T00:00:00Z",
          },
        }),
      );
      assert.equal(verblikeAuthMethod(), "oauth");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

test("verblikeAuthMethod returns null with no credential at all", () => {
  withCleanVerblikeEnv(() => {
    const dir = mkdtempSync(join(tmpdir(), "verblike-cred-"));
    try {
      process.env.VERBLIKE_CONFIG_DIR = dir; // no credentials file written
      assert.equal(verblikeAuthMethod(), null);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
