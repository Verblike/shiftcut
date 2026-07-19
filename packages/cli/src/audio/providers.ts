/**
 * Which voice / music engine a workflow will actually use, and whether
 * its local dependencies are present. Mirrors the resolution order the
 * media-use skill scripts use, so `auth status` and `doctor`
 * report the same engine the render pipeline would pick:
 *
 *   voice: Verblike Starfish → ElevenLabs (key + `elevenlabs`) → Kokoro (local)
 *   music: Verblike library  → Lyria (key + `google.genai`)   → MusicGen (local)
 *
 * The decision is split from the probing: `decide*` is pure (unit-tested
 * without spawning Python); `gather*` collects the live facts.
 */

import { hasPythonModules } from "../tts/python.js";

/** Python import names probed for each local engine. */
export const KOKORO_MODULES = ["kokoro_onnx", "soundfile"];
export const MUSICGEN_MODULES = ["transformers", "torch", "soundfile", "numpy"];

/** pip one-liners shown when a local engine's deps are missing. */
export const KOKORO_PIP = "pip install kokoro-onnx soundfile";
export const MUSICGEN_PIP = "pip install transformers torch soundfile numpy";

export type VoiceEngine = "verblike" | "elevenlabs" | "kokoro";
export type MusicEngine = "verblike" | "lyria" | "musicgen";

export interface EngineReadiness<E> {
  engine: E;
  /** Human label, e.g. "Kokoro". */
  label: string;
  /** A local engine (no account needed) vs a cloud provider keyed by env. */
  local: boolean;
  /** Usable right now: cloud key present, or local deps installed. */
  ready: boolean;
  /** Shown when `ready` is false — how to make it ready. */
  setupHint?: string;
}

export interface VoiceFacts {
  hasVerblike: boolean;
  /** ELEVENLABS_API_KEY set AND the `elevenlabs` module importable. */
  elevenlabs: boolean;
  /** Kokoro's local deps importable. */
  kokoro: boolean;
}

export interface MusicFacts {
  hasVerblike: boolean;
  /** A Gemini/Google key set AND `google.genai` importable. */
  lyria: boolean;
  /** MusicGen's local deps importable. */
  musicgen: boolean;
}

export function decideVoice(f: VoiceFacts): EngineReadiness<VoiceEngine> {
  if (f.hasVerblike)
    return { engine: "verblike", label: "Verblike Starfish", local: false, ready: true };
  if (f.elevenlabs) return { engine: "elevenlabs", label: "ElevenLabs", local: false, ready: true };
  return {
    engine: "kokoro",
    label: "Kokoro",
    local: true,
    ready: f.kokoro,
    ...(f.kokoro ? {} : { setupHint: KOKORO_PIP }),
  };
}

export function decideMusic(f: MusicFacts): EngineReadiness<MusicEngine> {
  if (f.hasVerblike)
    return { engine: "verblike", label: "Verblike library", local: false, ready: true };
  if (f.lyria) return { engine: "lyria", label: "Lyria (Gemini)", local: false, ready: true };
  return {
    engine: "musicgen",
    label: "MusicGen",
    local: true,
    ready: f.musicgen,
    ...(f.musicgen ? {} : { setupHint: MUSICGEN_PIP }),
  };
}

/** Collect live voice facts. Skips Python probes when Verblike is configured. */
function gatherVoiceFacts(hasVerblike: boolean): VoiceFacts {
  if (hasVerblike) return { hasVerblike, elevenlabs: false, kokoro: false };
  const elevenlabs = Boolean(process.env["ELEVENLABS_API_KEY"]) && hasPythonModules(["elevenlabs"]);
  const kokoro = hasPythonModules(KOKORO_MODULES);
  return { hasVerblike, elevenlabs, kokoro };
}

/** Collect live music facts. Skips Python probes when Verblike is configured. */
function gatherMusicFacts(hasVerblike: boolean): MusicFacts {
  if (hasVerblike) return { hasVerblike, lyria: false, musicgen: false };
  const hasLyriaKey = Boolean(process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"]);
  const lyria = hasLyriaKey && hasPythonModules(["google.genai"]);
  const musicgen = hasPythonModules(MUSICGEN_MODULES);
  return { hasVerblike, lyria, musicgen };
}

export function resolveVoice(hasVerblike: boolean): EngineReadiness<VoiceEngine> {
  return decideVoice(gatherVoiceFacts(hasVerblike));
}

export function resolveMusic(hasVerblike: boolean): EngineReadiness<MusicEngine> {
  return decideMusic(gatherMusicFacts(hasVerblike));
}
