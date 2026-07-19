import { strict as assert } from "node:assert";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { VERBLIKE_CLIENT_SOURCE_HEADERS } from "../../audio/scripts/lib/verblike.mjs";
import { VERBLIKE_CLIENT_SOURCE_ARGV } from "./verblike-cli.mjs";
import { verblikeSearch } from "./verblike-search.mjs";

test("tags Verblike searches with the shared media-use client source", () => {
  const dir = mkdtempSync(join(tmpdir(), "media-use-verblike-search-"));
  const capturePath = join(dir, "argv.log");
  const verblikePath = join(dir, "verblike");
  const previousPath = process.env.PATH;
  const previousCapturePath = process.env.VERBLIKE_CAPTURE_PATH;

  writeFileSync(
    verblikePath,
    `#!/bin/sh
printf '%s\\n' "$*" >> "$VERBLIKE_CAPTURE_PATH"
printf '%s\\n' '{"data":[{"id":"x"}]}'
`,
  );
  chmodSync(verblikePath, 0o755);
  process.env.PATH = `${dir}:${previousPath ?? ""}`;
  process.env.VERBLIKE_CAPTURE_PATH = capturePath;

  try {
    const result = verblikeSearch("audio sounds list", "ocean", { limit: 1 });
    const argv = readFileSync(capturePath, "utf8").trim();

    assert.deepEqual(result, [{ id: "x" }]);
    assert.match(argv, /X-Verblike-Client-Source: media-use/);
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
    if (previousCapturePath === undefined) delete process.env.VERBLIKE_CAPTURE_PATH;
    else process.env.VERBLIKE_CAPTURE_PATH = previousCapturePath;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("keeps CLI and REST media-use client source headers in lockstep", () => {
  const [entry] = Object.entries(VERBLIKE_CLIENT_SOURCE_HEADERS);
  assert.ok(entry);
  const [key, value] = entry;

  assert.equal(VERBLIKE_CLIENT_SOURCE_ARGV[1], `${key}: ${value}`);
});
