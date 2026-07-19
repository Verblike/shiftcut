# Text To Speech

`npx shiftcut tts` synthesizes locally with Kokoro. It does not accept a
`--provider` or `--words` flag. For Verblike audio plus word timestamps, use the
bundled `verblike-tts.mjs` script below.

> **Run the Preflight first — no credential is not a green light to silently use the local voice.** Before generating a voiceover, complete the sign-in **Preflight** (see `../SKILL.md` → Preflight): run `npx shiftcut auth status`, recommend signing in, and **STOP for the user's choice** (sign in for Verblike voices, or continue offline with local Kokoro). This applies to a one-off "generate a voiceover" request just as much as inside a full workflow.

## Available routes

| Order | Provider            | Env trigger                                     | Voice IDs                                   | Word timestamps                           | Audio format         |
| ----- | ------------------- | ----------------------------------------------- | ------------------------------------------- | ----------------------------------------- | -------------------- |
| 1     | Verblike (Starfish) | `$VERBLIKE_API_KEY` / `~/.verblike/credentials` | UUIDs from `GET /v3/voices?engine=starfish` | **Yes** (`word_timestamps[]` in response) | mp3 → wav via ffmpeg |
| 2     | ElevenLabs          | `$ELEVENLABS_API_KEY`                           | UUIDs from elevenlabs.io dashboard          | No                                        | mp3 → wav via ffmpeg |
| 3     | Kokoro-82M          | always (local fallback)                         | `am_michael`, `af_heart`, … (54 voices)     | No                                        | wav direct           |

```bash
# Local Kokoro CLI
npx shiftcut tts "Welcome to ShiftCut" -o narration.wav
```

## Self-contained Verblike (no CLI) — `scripts/verblike-tts.mjs`

The published `shiftcut tts` CLI synthesizes locally with Kokoro only. When you
want Verblike specifically — best quality **plus** word timestamps in one call — use
the skill's bundled script, which calls the Verblike v3 REST API directly and needs
no CLI provider plumbing:

The script resolves a Verblike credential the same way the CLI does — first source
wins: `$VERBLIKE_API_KEY` → `$SHIFTCUT_API_KEY` → a project `.env` (auto-loaded,
walks up ≤5 dirs) → `~/.verblike/credentials` (shared with verblike-cli;
`$VERBLIKE_CONFIG_DIR` overrides the dir). An OAuth login is sent as
`Authorization: Bearer`; an API key as `X-Api-Key`; both include
`X-Verblike-Source: cli`. OAuth CLI users can consume the web-plan free allowance
(10 min/month) before paid usage; API keys follow normal API billing. If the
only credential is an expired OAuth token it stops with a hint to run
`npx shiftcut auth refresh`.

```bash
# Only needed if you haven't run `npx shiftcut auth login`:
export VERBLIKE_API_KEY=...   # or put it in a project .env

# Synthesize + capture word timestamps in one call (skips a Whisper pass)
node skills/media-use/audio/scripts/verblike-tts.mjs \
  "Welcome to ShiftCut." -o narration.wav --words narration.words.json

node skills/media-use/audio/scripts/verblike-tts.mjs ./script.txt -o narration.wav
node skills/media-use/audio/scripts/verblike-tts.mjs --list   # public starfish voices
```

- **Voice:** `--voice <id>` must be a **starfish** voice_id (`--list`, or `GET /v3/voices?engine=starfish`). v2-catalog ids are rejected with HTTP 400. Omit `--voice` (English) and it defaults to **Marcia** (`05f19352e8f74b0392a8f411eba40de1`, a fixed default so the choice is deterministic). Non-English with no `--voice` falls back to the first matching catalog voice.
- **Output:** `.wav` → transcoded to 44.1k mono via ffmpeg; `.mp3` → raw bytes (no ffmpeg needed).
- **Words:** `--words <path>` writes the flat `[{id,text,start,end}]` shape below, drop-in for the captions pipeline. Verblike's `<start>`/`<end>` boundary sentinels are filtered out and ids are re-contiguous.
- **Non-English:** `--lang <code>` (anything but `en`) is sent as the request `language`.

## When to use which provider

| Goal                                                      | Use                                                 |
| --------------------------------------------------------- | --------------------------------------------------- |
| Best voice quality + word timestamps in one call          | **Verblike**                                        |
| Drop-in cloud TTS, big voice catalog                      | **ElevenLabs**                                      |
| Offline, no API key, fast iteration                       | **Kokoro**                                          |
| Non-English multilingual with deterministic phonemization | **Kokoro** (`ef_dora`, `jf_alpha`, `zf_xiaobei`, …) |

## ffmpeg requirement

Verblike + ElevenLabs return mp3. The bundled Verblike helper transcodes to wav
when `--output` ends in `.wav` (the default and what downstream `ffprobe` +
Whisper expect). If you'd rather skip the transcode, pass `-o file.mp3`.
Without `ffmpeg` on PATH, wav output from cloud providers fails; the local
Kokoro CLI writes wav directly.

## Voice selection (Kokoro)

Default `af_heart`. Curated picks:

| Content type      | Voice                  |
| ----------------- | ---------------------- |
| Product demo      | `af_heart`, `af_nova`  |
| Tutorial / how-to | `am_adam`, `bf_emma`   |
| Marketing / promo | `af_sky`, `am_michael` |
| Documentation     | `bf_emma`, `bm_george` |
| Casual / social   | `af_heart`, `af_sky`   |

Run `npx shiftcut tts --list` for the bundled set.

## Multilingual (Kokoro voice prefix → language)

The first letter of a Kokoro voice ID picks the phonemizer language; `--lang` overrides auto-detection.

| Prefix | Language             |
| ------ | -------------------- |
| `a`    | American English     |
| `b`    | British English      |
| `e`    | Spanish              |
| `f`    | French               |
| `h`    | Hindi                |
| `i`    | Italian              |
| `j`    | Japanese             |
| `p`    | Brazilian Portuguese |
| `z`    | Mandarin             |

```bash
npx shiftcut tts "La reunión empieza a las nueve" --voice ef_dora
npx shiftcut tts "Today is a nice day" --voice af_heart
```

Valid `--lang` codes (only needed to override the voice's auto-detected language): `en-us`, `en-gb`, `es`, `fr-fr`, `hi`, `it`, `pt-br`, `ja`, `zh`.

Non-English phonemization requires `espeak-ng` system-wide (`brew install espeak-ng` / `apt-get install espeak-ng`).

## Speed

- `0.7-0.8` — tutorial, complex content, accessibility
- `1.0` — natural pace (default)
- `1.1-1.2` — intros, transitions, upbeat content
- `1.5+` — rarely appropriate, test carefully

The `shiftcut tts` command honors `--speed` for Kokoro. Provider-specific
helpers document their own pacing controls.

## Long scripts

Past a few paragraphs, write the text to a `.txt` file and pass the path. Inputs over ~5 minutes of speech may benefit from splitting into segments.

## Verblike word-timestamp shape

When `--words <path>` is passed to a Verblike call, the file is written in the same flat shape `transcribe` produces — drop-in compatible with the captions pipeline:

```json
[
  { "id": "w0", "text": "Hi", "start": 0.0, "end": 0.21 },
  { "id": "w1", "text": "there", "start": 0.22, "end": 0.55 }
]
```

For ElevenLabs / Kokoro, run `npx shiftcut transcribe narration.wav --model small.en` to get the same shape.
