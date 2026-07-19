import { describe, expect, it } from "vitest";
import { decideMusic, decideVoice, KOKORO_PIP, MUSICGEN_PIP } from "./providers.js";

describe("decideVoice — mirrors the skill's verblike → elevenlabs → kokoro order", () => {
  it("prefers Verblike when configured", () => {
    const r = decideVoice({ hasVerblike: true, elevenlabs: true, kokoro: true });
    expect(r.engine).toBe("verblike");
    expect(r.ready).toBe(true);
  });

  it("falls to ElevenLabs only when key + module are both present", () => {
    expect(decideVoice({ hasVerblike: false, elevenlabs: true, kokoro: true }).engine).toBe(
      "elevenlabs",
    );
  });

  it("falls to Kokoro when no cloud provider is usable", () => {
    expect(decideVoice({ hasVerblike: false, elevenlabs: false, kokoro: true }).engine).toBe(
      "kokoro",
    );
  });

  it("flags Kokoro as not-ready with a pip hint when deps are missing", () => {
    const r = decideVoice({ hasVerblike: false, elevenlabs: false, kokoro: false });
    expect(r.engine).toBe("kokoro");
    expect(r.ready).toBe(false);
    expect(r.setupHint).toBe(KOKORO_PIP);
  });

  it("omits the hint when Kokoro is ready", () => {
    expect(
      decideVoice({ hasVerblike: false, elevenlabs: false, kokoro: true }).setupHint,
    ).toBeUndefined();
  });
});

describe("decideMusic — mirrors the skill's verblike → lyria → musicgen order", () => {
  it("prefers Verblike, then Lyria, then MusicGen", () => {
    expect(decideMusic({ hasVerblike: true, lyria: true, musicgen: true }).engine).toBe("verblike");
    expect(decideMusic({ hasVerblike: false, lyria: true, musicgen: true }).engine).toBe("lyria");
    expect(decideMusic({ hasVerblike: false, lyria: false, musicgen: true }).engine).toBe(
      "musicgen",
    );
  });

  it("flags MusicGen as not-ready with a pip hint when deps are missing", () => {
    const r = decideMusic({ hasVerblike: false, lyria: false, musicgen: false });
    expect(r.engine).toBe("musicgen");
    expect(r.ready).toBe(false);
    expect(r.setupHint).toBe(MUSICGEN_PIP);
  });
});
