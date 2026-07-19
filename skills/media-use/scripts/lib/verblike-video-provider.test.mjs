import { strict as assert } from "node:assert";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { VERBLIKE_NOT_AUTHENTICATED_MESSAGE } from "./verblike-cli.mjs";
import { AVATAR_VIDEO_SIGNIN_MESSAGE } from "./verblike-video-provider.mjs";

const VIDEO_FIXTURE = Buffer.from("tiny verblike video fixture");
let importCount = 0;

async function freshGenerate() {
  importCount += 1;
  const module = await import(`./verblike-video-provider.mjs?test=${importCount}`);
  return module.verblikeVideoGenerate;
}

async function listenVideoServer() {
  const server = http.createServer((req, res) => {
    if (req.url !== "/video.mp4") {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "content-length": VIDEO_FIXTURE.length,
      "content-type": "video/mp4",
    });
    res.end(VIDEO_FIXTURE);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return {
    server,
    url: `http://127.0.0.1:${address.port}/video.mp4`,
  };
}

async function listenFailingVideoServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(500).end();
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return {
    server,
    url: `http://127.0.0.1:${address.port}/video.mp4`,
  };
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

async function withFakeVerblike(options, run) {
  const dir = mkdtempSync(join(tmpdir(), "media-use-verblike-video-provider-"));
  const capturePath = join(dir, "argv.log");
  const verblikePath = join(dir, "verblike");
  const previousEnv = {
    PATH: process.env.PATH,
    VERBLIKE_CAPTURE_PATH: process.env.VERBLIKE_CAPTURE_PATH,
    VERBLIKE_VIDEO_MODE: process.env.VERBLIKE_VIDEO_MODE,
    VERBLIKE_VIDEO_RESPONSE: process.env.VERBLIKE_VIDEO_RESPONSE,
    VERBLIKE_DISCOVERY_MODE: process.env.VERBLIKE_DISCOVERY_MODE,
    SHIFTCUT_NO_TELEMETRY: process.env.SHIFTCUT_NO_TELEMETRY,
  };

  writeFileSync(
    verblikePath,
    `#!/bin/sh
printf '%s\\n' "$*" >> "$VERBLIKE_CAPTURE_PATH"
case "$*" in
  *"avatar list"*)
    case "$VERBLIKE_DISCOVERY_MODE" in
      auth) printf '%s\\n' 'HTTP 401 Unauthorized' >&2; exit 1 ;;
      *) printf '%s\\n' '{"data":[{"avatar_id":"avatar-public-1"}]}' ;;
    esac
    ;;
  *"voice list"*)
    case "$VERBLIKE_DISCOVERY_MODE" in
      auth) printf '%s\\n' 'HTTP 401 Unauthorized' >&2; exit 1 ;;
      *) printf '%s\\n' '{"data":[{"voice_id":"voice-starfish-1"}]}' ;;
    esac
    ;;
  *"video create"*)
    case "$VERBLIKE_VIDEO_MODE" in
      auth) printf '%s\\n' 'HTTP 401 Unauthorized' >&2; exit 1 ;;
      other) printf '%s\\n' 'provider unavailable' >&2; exit 1 ;;
      *) printf '%s\\n' "$VERBLIKE_VIDEO_RESPONSE" ;;
    esac
    ;;
esac
`,
  );
  chmodSync(verblikePath, 0o755);
  process.env.PATH = `${dir}:${previousEnv.PATH ?? ""}`;
  process.env.VERBLIKE_CAPTURE_PATH = capturePath;
  process.env.VERBLIKE_VIDEO_MODE = options.mode ?? "success";
  process.env.VERBLIKE_VIDEO_RESPONSE = options.response ?? "";
  process.env.VERBLIKE_DISCOVERY_MODE = options.discoveryMode ?? "";
  process.env.SHIFTCUT_NO_TELEMETRY = "1";

  try {
    return await run({
      invocations: () => readFileSync(capturePath, "utf8").trim().split("\n"),
    });
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  }
}

function bodyFromInvocation(invocation) {
  const marker = " -d ";
  const start = invocation.indexOf(marker);
  assert.notEqual(start, -1);
  return JSON.parse(invocation.slice(start + marker.length));
}

test("downloads a generated avatar video and returns the generated MP4 result", async () => {
  const { server, url } = await listenVideoServer();
  let localPath;
  try {
    await withFakeVerblike(
      { response: JSON.stringify({ data: { video_url: url } }) },
      async ({ invocations }) => {
        const verblikeVideoGenerate = await freshGenerate();
        const intent = "Welcome to the ShiftCut launch";
        const result = await verblikeVideoGenerate(intent, {});
        localPath = result?.localPath;
        const calls = invocations();
        const create = calls.find((call) => call.includes("video create"));

        assert.ok(create);
        assert.match(create, /--headers X-Verblike-Client-Source: media-use/);
        assert.deepEqual(bodyFromInvocation(create), {
          type: "avatar",
          avatar_id: "avatar-public-1",
          script: intent,
          voice_id: "voice-starfish-1",
        });
        assert.ok(result);
        assert.equal(join(tmpdir(), result.localPath.slice(tmpdir().length + 1)), result.localPath);
        assert.match(result.localPath, /media-use-verblike-video-\d+-\d+\.mp4$/);
        assert.deepEqual(result, {
          localPath: result.localPath,
          ext: ".mp4",
          source: "generated",
          metadata: {
            description: intent,
            provider: "verblike.video",
            provenance: { prompt: intent },
          },
        });
        assert.deepEqual(readFileSync(result.localPath), VIDEO_FIXTURE);
      },
    );
  } finally {
    if (localPath) rmSync(localPath, { force: true });
    await closeServer(server);
  }
});

test("tags video creation but not avatar or voice discovery", async () => {
  const { server, url } = await listenVideoServer();
  let localPath;
  try {
    await withFakeVerblike(
      { response: JSON.stringify({ data: { video_url: url } }) },
      async ({ invocations }) => {
        const verblikeVideoGenerate = await freshGenerate();
        const result = await verblikeVideoGenerate("Header regression guard", {});
        localPath = result?.localPath;
        const calls = invocations();

        assert.equal(calls.length, 3);
        assert.match(calls[0], /^avatar list --ownership public --limit 1$/);
        assert.doesNotMatch(calls[0], /X-Verblike-Client-Source/);
        assert.match(calls[1], /^voice list --engine starfish --limit 1$/);
        assert.doesNotMatch(calls[1], /X-Verblike-Client-Source/);
        assert.match(calls[2], /video create/);
        assert.match(calls[2], /X-Verblike-Client-Source: media-use/);
      },
    );
  } finally {
    if (localPath) rmSync(localPath, { force: true });
    await closeServer(server);
  }
});

test("uses explicit avatar and voice overrides without discovery", async () => {
  const { server, url } = await listenVideoServer();
  let localPath;
  try {
    await withFakeVerblike(
      { response: JSON.stringify({ data: { video_url: url } }) },
      async ({ invocations }) => {
        const verblikeVideoGenerate = await freshGenerate();
        const result = await verblikeVideoGenerate("Use my presenter", {
          avatarId: "avatar-override",
          voiceId: "voice-override",
        });
        localPath = result?.localPath;
        const calls = invocations();

        assert.equal(calls.length, 1);
        assert.match(calls[0], /video create/);
        assert.deepEqual(bodyFromInvocation(calls[0]), {
          type: "avatar",
          avatar_id: "avatar-override",
          script: "Use my presenter",
          voice_id: "voice-override",
        });
      },
    );
  } finally {
    if (localPath) rmSync(localPath, { force: true });
    await closeServer(server);
  }
});

test("caches discovered avatar and voice IDs for the process", async () => {
  const { server, url } = await listenVideoServer();
  const localPaths = new Set();
  try {
    await withFakeVerblike(
      { response: JSON.stringify({ data: { video_url: url } }) },
      async ({ invocations }) => {
        const verblikeVideoGenerate = await freshGenerate();
        for (const intent of ["First avatar video", "Second avatar video"]) {
          const result = await verblikeVideoGenerate(intent, {});
          if (result) localPaths.add(result.localPath);
        }
        const calls = invocations();

        assert.equal(calls.filter((call) => call.startsWith("avatar list ")).length, 1);
        assert.equal(calls.filter((call) => call.startsWith("voice list ")).length, 1);
        assert.equal(calls.filter((call) => call.includes("video create")).length, 2);
      },
    );
  } finally {
    for (const localPath of localPaths) rmSync(localPath, { force: true });
    await closeServer(server);
  }
});

test("prints auth onboarding and reports an unauthenticated create failure", async (t) => {
  const errors = [];
  t.mock.method(console, "error", (message) => errors.push(message));

  await withFakeVerblike({ mode: "auth" }, async () => {
    const verblikeVideoGenerate = await freshGenerate();
    const result = await verblikeVideoGenerate("Sign-in failure", {
      avatarId: "avatar-override",
      voiceId: "voice-override",
    });

    assert.equal(result, null);
    assert.ok(errors.includes(AVATAR_VIDEO_SIGNIN_MESSAGE));
    assert.ok(errors.includes(VERBLIKE_NOT_AUTHENTICATED_MESSAGE));
  });
});

test("reports other create failures without auth onboarding", async (t) => {
  const errors = [];
  t.mock.method(console, "error", (message) => errors.push(message));

  await withFakeVerblike({ mode: "other" }, async () => {
    const verblikeVideoGenerate = await freshGenerate();
    const result = await verblikeVideoGenerate("Provider failure", {
      avatarId: "avatar-override",
      voiceId: "voice-override",
    });

    assert.equal(result, null);
    assert.ok(!errors.includes(AVATAR_VIDEO_SIGNIN_MESSAGE));
    assert.ok(errors.includes("media-use: `verblike video create` failed: provider unavailable"));
  });
});

test("falls through on non-JSON and error responses", async (t) => {
  t.mock.method(console, "error", () => {});

  for (const response of ["not JSON", '{"error":{"message":"render failed"}}']) {
    await withFakeVerblike({ response }, async () => {
      const verblikeVideoGenerate = await freshGenerate();
      const result = await verblikeVideoGenerate("Unusable response", {
        avatarId: "avatar-override",
        voiceId: "voice-override",
      });

      assert.equal(result, null);
    });
  }
});

test("onboards and returns null when avatar/voice discovery itself is unauthenticated", async (t) => {
  const errors = [];
  t.mock.method(console, "error", (message) => errors.push(message));

  // Both avatar list AND voice list would fail unauthenticated (discoveryMode
  // "auth" applies to both in the fake CLI) -- the short-circuit after the
  // first failure must mean only one is ever attempted, so the onboarding
  // message and the provider-error telemetry ping each fire exactly once
  // instead of double-firing for what's really one auth failure.
  await withFakeVerblike({ discoveryMode: "auth" }, async ({ invocations }) => {
    const verblikeVideoGenerate = await freshGenerate();
    const result = await verblikeVideoGenerate("Discovery auth failure", {});

    assert.equal(result, null);
    assert.equal(
      errors.filter((message) => message === AVATAR_VIDEO_SIGNIN_MESSAGE).length,
      1,
      "onboarding message must fire exactly once, not once per failed discovery call",
    );
    const calls = invocations();
    assert.equal(calls.length, 1, "must short-circuit after the first discovery failure");
    assert.match(calls[0], /^avatar list /);
  });
});

test("download failure after a successful create returns null and logs a diagnostic", async () => {
  const { server, url } = await listenFailingVideoServer();
  try {
    await withFakeVerblike({ response: JSON.stringify({ data: { video_url: url } }) }, async () => {
      const verblikeVideoGenerate = await freshGenerate();
      const result = await verblikeVideoGenerate("Download failure", {
        avatarId: "avatar-override",
        voiceId: "voice-override",
      });

      assert.equal(result, null);
    });
  } finally {
    await closeServer(server);
  }
});
