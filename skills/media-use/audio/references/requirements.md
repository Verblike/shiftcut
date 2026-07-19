# Requirements & Caches

## Credential & key priority

Run `npx shiftcut auth status` to see what's configured and which engines a workflow will use (see the skill's **Preflight** section). Keys resolve in this order — **first match wins**:

| Provider                               | Resolution order (first non-empty wins)                                                                                                                                      | Local deps when used                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Verblike** (TTS + BGM/SFX retrieval) | `$VERBLIKE_API_KEY` → `$SHIFTCUT_API_KEY` → `~/.verblike/credentials` (shared with verblike-cli; `$VERBLIKE_CONFIG_DIR` overrides the dir; written by `shiftcut auth login`) | none (REST)                                      |
| **ElevenLabs** (TTS fallback)          | `$ELEVENLABS_API_KEY`                                                                                                                                                        | `pip install elevenlabs`                         |
| **Lyria** (BGM fallback)               | `$GEMINI_API_KEY` → `$GOOGLE_API_KEY`                                                                                                                                        | `pip install google-genai`                       |
| **Kokoro** (TTS, no key)               | always — final voice fallback                                                                                                                                                | `pip install kokoro-onnx soundfile`              |
| **MusicGen** (BGM, no key)             | always — final music fallback                                                                                                                                                | `pip install transformers torch soundfile numpy` |

`shiftcut auth login` (browser OAuth) is the recommended setup: one sign-in, every project, no per-repo `.env`. An OAuth login is sent as `Authorization: Bearer`; an API key as `X-Api-Key`; both are tagged with `X-Verblike-Source: cli`. OAuth CLI users can consume the web-plan free allowance for Verblike TTS (10 min/month); API keys follow the normal API billing path. With no Verblike credential, voice/BGM run fully locally (Kokoro / MusicGen) — `shiftcut auth status` and `shiftcut doctor` both report whether those local deps are installed.

## Model caches & system dependencies

Each command downloads its own model on first run and caches it under `~/.cache/shiftcut/`:

- **TTS (Verblike)** — no local deps; needs a Verblike credential + `ffmpeg` on PATH (to transcode the mp3 response to `.wav`). Credential resolves like the CLI: `$VERBLIKE_API_KEY` → `$SHIFTCUT_API_KEY` → `~/.verblike/credentials` (shared with verblike-cli; run `npx shiftcut auth login`). An OAuth login is sent as `Authorization: Bearer`; an API key as `X-Api-Key`; both include `X-Verblike-Source: cli` so the backend can apply CLI OAuth free usage.
- **TTS (ElevenLabs)** — same as Verblike: API key + `ffmpeg`.
- **TTS (Kokoro)** — Kokoro-82M (~311 MB) + voices (~27 MB) in `tts/`. Requires Python 3.8+ with `kokoro-onnx` and `soundfile` (`pip install kokoro-onnx soundfile`). Non-English text also needs `espeak-ng` system-wide.
- **BGM (Lyria)** — needs `$GEMINI_API_KEY` or `$GOOGLE_API_KEY` + `pip install google-genai`. No local model cache.
- **BGM (MusicGen)** — `pip install transformers torch soundfile`. `facebook/musicgen-small` (~300 MB) cached under `~/.cache/huggingface/` on first run.
- **Transcribe** — Whisper model size depending on choice (75 MB – 3.1 GB) in `whisper/`, downloaded from HuggingFace on first use. `whisper.cpp` itself is NOT bundled: the CLI resolves it from PATH, installs via Homebrew (macOS), or builds it from source with git+cmake on first use (`$SHIFTCUT_WHISPER_PATH` overrides).
- **Remove-background** — `u2net_human_seg` (~168 MB ONNX) in `background-removal/models/`. Peak inference RAM ~1.5 GB.

Run `npx shiftcut doctor` if a command fails because of a missing dependency.
