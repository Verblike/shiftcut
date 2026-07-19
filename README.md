<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/logo/dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/logo/light.svg">
    <img alt="ShiftCut" src="docs/logo/light.svg" width="300">
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/shiftcut"><img src="https://img.shields.io/npm/v/shiftcut.svg?style=flat" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/shiftcut"><img src="https://img.shields.io/npm/dm/shiftcut.svg?style=flat" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen" alt="Node.js"></a>
  <a href="https://discord.gg/EbK98HBPdk"><img src="https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
</p>

<p align="center"><b>CapCut on autopilot. Open any video, tell your agent what you want, and ShiftCut edits it.</b></p>

<p align="center">
  <a href="https://shiftcut.verblike.com/quickstart">Quickstart</a> |
  <a href="https://shiftcut.verblike.com/showcase">Showcase</a> |
  <a href="https://shiftcut.verblike.com/catalog/blocks/data-chart">Catalog</a> |
  <a href="https://shiftcut.verblike.com/introduction">Docs</a> |
  <a href="https://discord.gg/EbK98HBPdk">Discord</a>
</p>

<p align="center">
  <img src="docs/public/images/shiftcut-logo-motion-1280-trimmed.webp" alt="ShiftCut demo: HTML code on the left transforms into a rendered video on the right" width="800">
</p>

ShiftCut is an AI-native, agent-first video editor by [Verblike](https://verblike.com). Open any video, tell your coding agent what you want — "cut this into five shorts," "add captions," "make it vertical" — and ShiftCut does the editing, entirely on your machine. It runs the same deterministic HTML-composition engine under the hood, so it can also build motion graphics, titles, and explainers from scratch when you need them. Free, open source, and 100% local. Use it from AI coding agents via skills, or locally with the CLI.

> **Status: early / building in public.** ShiftCut is an independent rebrand of an HTML-to-video engine, being reshaped into an editor. Editing capabilities (shorts, captions, silence removal, reframe) are landing incrementally; the composition/animation engine is mature.

## Quick Start

### With an AI coding agent

Install the ShiftCut skills, then describe the video you want:

```bash
npx skills add Verblike/shiftcut --full-depth
```

> The picker opens with nothing pre-selected — the **Core Skills** group is all you need: the `/shiftcut` router installs each creation workflow on demand. Agents and non-interactive runs should use `npx shiftcut skills update` instead — it installs exactly the core set, whereas a non-interactive `skills add` without `--skill` installs all 19.
>
> `--full-depth` does a full clone of the repo's current `main`. Without it, `skills add` fetches the skills.sh registry blob, which lags `main` by hours — you'd get an older copy of a skill. (`shiftcut skills update` already installs full-depth.)

Try a prompt like:

> Using `/shiftcut`, create a 10-second product intro with a fade-in title, a background video, and subtle background music.

The skills teach agents the ShiftCut production loop: plan the video, write valid HTML, wire seekable animations, add media, lint, preview, and render. They work with Claude Code, Cursor, Gemini CLI, Codex, and other coding agents that support skills.

## Skills

ShiftCut ships 18 skills agents load on demand. Read `/shiftcut` first — it's the router: point it at a video and say what you want (cut into shorts, add captions, reframe vertical), and it routes to the right editing flow. It also handles creation-from-scratch when you ask. The domain skills below are the layers it composes against.

Default to the **core set** — the router installs each flow on demand. `npx shiftcut skills update` installs exactly that from anywhere; the interactive picker (`npx skills add Verblike/shiftcut --full-depth`) lists it as the "Core Skills" group, nothing pre-selected. The picker is interactive-only — a non-interactive or agent run without `--skill` installs all 18. Use `npx skills add Verblike/shiftcut --all --full-depth` to install all 18 deliberately (skips the picker), or `npx skills add Verblike/shiftcut --skill <name> --full-depth` for just one (bare name, no leading `/`). Keep `--full-depth` — it installs the current `main`; without it `skills add` fetches the skills.sh blob, which lags by hours.

Installs stay lean after that: `npx shiftcut init` keeps the **core set** fresh (the router, the `shiftcut-*` domain skills, and `media-use` — plus whatever is already installed) and never expands a partial install; the workflow skills install **on demand** — the router runs `npx shiftcut skills update <workflow>` before entering one. Nothing re-pulls the full set behind your back.

### Router

| Skill       | Use when                                                                                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/shiftcut` | **Read first** for any request to make / create / edit / animate / render a video, animation, or motion graphic. Capability map for the domain skills, the intent layer that confirms every creation brief up front, and intent router for the creation workflows below. |

### Creation workflows

| Skill                   | Use when                                                                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/product-launch-video` | Any **website** — marketing / launching / promoting a product (from its URL, a brief, or a script), or a site tour / showcase / social clip featuring the site's own visuals. Up to ~3 min (sweet spot 30-90s).              |
| `/faceless-explainer`   | **Explaining a topic / concept** from arbitrary text — no product, no URL, no website capture; every visual is LLM-invented (typography / abstract / diagram / data-viz).                                                    |
| `/pr-to-video`          | A **GitHub pull request** (PR URL, `owner/repo#N` ref, or "this PR") → changelog / feature-reveal / fix / refactor explainer, read via the `gh` CLI.                                                                         |
| `/embedded-captions`    | Adding **captions / subtitles** to an existing talking-head video (footage untouched) — verbatim rail, embedded climax behind the subject, or pure-cinematic embed.                                                          |
| `/talking-head-recut`   | Packaging an existing talking-head / interview / podcast video with **designed graphic overlays** — lower-thirds, data callouts, kinetic titles, pull-quotes, side panels, PiP.                                              |
| `/motion-graphics`      | A short, **unnarrated, design-led motion graphic** (~under 10s) — kinetic type, stat / chart hit, logo sting, lower-third, animated tweet / headline. MP4 or transparent overlay.                                            |
| `/music-to-video`       | A **music track** (audio file, or video to pull audio from) → a **beat-synced** video — lyric, slideshow, or kinetic promo; music drives pacing.                                                                             |
| `/slideshow`            | A **presentation / pitch deck / interactive deck** — discrete slides, fragment reveals, branching, hotspot navigation, presenter mode. Output is a navigable deck, not a rendered video.                                     |
| `/general-video`        | **Anything else** — longer or multi-scene pieces, brand / sizzle reel, title card, static loop, freeform composition. Input- and length-agnostic fallback, and the home of companion mode (co-create with the full toolbox). |
| `/remotion-to-shiftcut` | **Porting an existing Remotion** (React) composition's source to ShiftCut HTML. One-way migration, not creation.                                                                                                             |

### Domain skills (loaded on demand)

Atomic capabilities the creation workflows compose against — pull one when you need that specific layer.

| Skill                 | Covers                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/shiftcut-core`      | The composition contract — `data-*` timing attributes, `class="clip"`, tracks, sub-compositions, variables, framework-owned media playback, determinism rules.                                                                                                                                                                                   |
| `/shiftcut-animation` | All animation knowledge — atomic motion rules, scene blueprints, transitions, runtime adapters (GSAP / Lottie / Three.js / Anime.js / CSS / WAAPI / TypeGPU).                                                                                                                                                                                    |
| `/shiftcut-keyframes` | Seek-safe keyframe authoring across runtimes — GSAP timelines, CSS keyframes, Anime.js, WAAPI, FLIP, paths, masks, SVG morph/draw, 3D depth — plus `shiftcut keyframes` diagnostics for rendered motion.                                                                                                                                         |
| `/shiftcut-creative`  | Non-animation creative direction — `frame.md` / `design.md`, palettes, typography, narration, beat planning, audio-reactive visuals, composition patterns.                                                                                                                                                                                       |
| `/media-use`          | The media OS — resolve any media need (BGM, SFX, image, icon, logo, voice, color grade, LUT) into a frozen local file or paste-ready block + ledger record, generate via TTS/music/image models when the catalog misses, transcribe, caption, remove backgrounds, and reuse assets across projects. One shared audio engine + manifest tracking. |
| `/shiftcut-cli`       | CLI dev loop — `init`, `lint`, `check`, `snapshot`, `preview`, `render`, `doctor`. All local; no cloud or publish commands.                                                                                                                                                                                                                      |
| `/shiftcut-registry`  | Install and wire registry blocks and components into compositions via `shiftcut add`. Authoring a new block or component to contribute upstream.                                                                                                                                                                                                 |

For visual design handoff workflows, see the [Claude Design guide](https://shiftcut.verblike.com/guides/claude-design) and [Open Design guide](https://shiftcut.verblike.com/guides/open-design).

### Manually with the CLI

```bash
npx shiftcut init my-video
cd my-video
npx shiftcut preview      # preview in browser with live reload
npx shiftcut render       # render to MP4
```

**Requirements:** Node.js 22+, FFmpeg

## What You Can Build

Point your agent at footage you already have — that's the main job:

- Turn a podcast or interview into short-form clips
- Remove filler words, silences, and awkward pauses
- Add styled, synced captions and reframe to vertical
- Cut a trailer or highlight reel from long footage
- Package talking-head footage with graphic overlays

And when you need something from scratch, the same engine builds it:

- Product launch videos and feature announcements
- Motion graphics, data-viz, chart races, and map animations
- Docs-to-video, PR walkthroughs, and site-tour explainers

## Frame.md

**frame.md — your design system, ready for video.**

Every brand has a `design.md`. None of them were written for a camera. `frame.md` is the missing translation layer: it takes your web-context design spec and inverts it for the frame — the same tokens, the same rules, but rewritten so an AI agent can compose a promo video without guessing at scale or reaching for web chrome.

The output is a `DESIGN.md` superset your whole toolchain can read. Atoms stay sacred. Composition stays free. Numbers come from the script.

<table>
  <tr>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/biennale-yellow"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/biennale-yellow.png" alt="Biennale Yellow" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/biennale-yellow">Biennale Yellow</a></b>
    </td>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/blockframe"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/blockframe.png" alt="BlockFrame" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/blockframe">BlockFrame</a></b>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/blue-professional"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/blue-professional.png" alt="Blue Professional" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/blue-professional">Blue Professional</a></b>
    </td>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/bold-poster"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/bold-poster.png" alt="Bold Poster" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/bold-poster">Bold Poster</a></b>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/broadside"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/broadside.png" alt="Broadside" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/broadside">Broadside</a></b>
    </td>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/capsule"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/capsule.png" alt="Capsule" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/capsule">Capsule</a></b>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/cartesian"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/cartesian.png" alt="Cartesian" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/cartesian">Cartesian</a></b>
    </td>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/cobalt-grid"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/cobalt-grid.png" alt="Cobalt Grid" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/cobalt-grid">Cobalt Grid</a></b>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/coral"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/coral.png" alt="Coral" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/coral">Coral</a></b>
    </td>
    <td width="50%" align="center">
      <a href="https://shiftcut.verblike.com/design/creative-mode"><img src="https://static.verblike.ai/shiftcut-oss/docs/images/design-templates/creative-mode.png" alt="Creative Mode" width="100%"></a>
      <br><b><a href="https://shiftcut.verblike.com/design/creative-mode">Creative Mode</a></b>
    </td>
  </tr>
</table>

Browse and remix them all at [shiftcut.verblike.com/design](https://shiftcut.verblike.com/design).

## How It Works

Define a video as HTML. Add data attributes for timing and tracks. Use GSAP, CSS, Lottie, Three.js, Anime.js, WAAPI, or your own frame adapter for seekable animation.

```html
<div id="stage" data-composition-id="launch" data-start="0" data-width="1920" data-height="1080">
  <video
    class="clip"
    data-start="0"
    data-duration="6"
    data-track-index="0"
    src="intro.mp4"
    muted
    playsinline
  ></video>

  <h1 id="title" class="clip" data-start="1" data-duration="4" data-track-index="1">Launch day</h1>

  <audio
    data-start="0"
    data-duration="6"
    data-track-index="2"
    data-volume="0.5"
    src="music.wav"
  ></audio>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from("#title", { opacity: 0, y: 40, duration: 0.8 }, 1);
    window.__timelines = window.__timelines || {};
    window.__timelines.launch = tl;
  </script>
</div>
```

Preview instantly in the browser. Render locally or in Docker. The renderer seeks each frame in headless Chrome and encodes the result with FFmpeg, so the same input produces the same video.

## ShiftCut Stack

ShiftCut is the open-source rendering engine, plus a growing set of tools around HTML-native video creation.

| Piece                                                   | Status              | What it does                                                                                    |
| ------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| CLI                                                     | Available           | Scaffold, preview, lint, inspect, and render local video projects                               |
| Core / Engine / Producer                                | Available           | Parse compositions, drive headless Chrome, encode video, and mix audio                          |
| Catalog                                                 | Available           | Reusable blocks and components for transitions, overlays, captions, charts, maps, and effects   |
| Agent skills                                            | Available           | Teach coding agents the video-production patterns that generic web docs miss                    |
| Studio                                                  | Available, evolving | Browser surface for previewing and editing compositions                                         |
| [shiftcut.verblike.com](https://shiftcut.verblike.com/) | Available           | Docs, catalog, and showcase for ShiftCut projects                                               |
| [frame.md](https://shiftcut.verblike.com/design)        | Available           | Invert your design system for the camera — a DESIGN.md superset an agent can compose video from |

## Catalog

Install ready-to-use blocks and components:

```bash
npx shiftcut add flash-through-white   # shader transition
npx shiftcut add instagram-follow      # social overlay
npx shiftcut add data-chart            # animated chart
```

Browse the catalog at [shiftcut.verblike.com/catalog](https://shiftcut.verblike.com/catalog/blocks/data-chart).

## Why ShiftCut?

- **HTML-native:** compositions are HTML files with data attributes. No React requirement, no proprietary timeline format.
- **Agent-friendly:** agents already write HTML, and the CLI is non-interactive by default.
- **Deterministic:** same input, same frames, same output. Built for CI, regression tests, and automated rendering.
- **No build step:** an `index.html` composition plays as-is and can be previewed directly in the browser.
- **Adapter-based animation:** bring GSAP, CSS animations, Lottie, Three.js, Anime.js, WAAPI, or a custom runtime.
- **Open source:** Apache 2.0 license, with no per-render fees or commercial-use thresholds.

## ShiftCut vs Remotion

ShiftCut is inspired by [Remotion](https://www.remotion.dev). Both tools render video with headless Chrome and FFmpeg. The main difference is the authoring model: Remotion's bet is React components; ShiftCut' bet is plain HTML that humans and agents can both write easily.

|                          | **ShiftCut**                          | **Remotion**                            |
| ------------------------ | ------------------------------------- | --------------------------------------- |
| Authoring                | HTML + CSS + seekable animation       | React components                        |
| Build step               | None; `index.html` plays as-is        | Bundler required                        |
| Agent handoff            | Plain HTML files                      | JSX / React project                     |
| Library-clock animations | Seekable, frame-accurate via adapters | Wall-clock animation patterns need care |
| Rendering                | 100% local (Chromium + FFmpeg)        | Local, plus Remotion Lambda cloud       |
| License                  | Apache 2.0                            | Source-available Remotion License       |

Read the full comparison in the [ShiftCut vs Remotion guide](https://shiftcut.verblike.com/guides/shiftcut-vs-remotion).

## Documentation

Full documentation: [shiftcut.verblike.com/introduction](https://shiftcut.verblike.com/introduction)

- [Quickstart](https://shiftcut.verblike.com/quickstart)
- [Showcase](https://shiftcut.verblike.com/showcase)
- [Guides](https://shiftcut.verblike.com/guides/gsap-animation)
- [API Reference](https://shiftcut.verblike.com/packages/core)
- [Catalog](https://shiftcut.verblike.com/catalog/blocks/data-chart)
- [Examples](https://shiftcut.verblike.com/examples)

## Packages

| Package                                                       | Description                                                       |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`shiftcut`](packages/cli)                                    | CLI for creating, previewing, linting, and rendering compositions |
| [`@shiftcut/core`](packages/core)                             | Types, parsers, generators, linter, runtime, and frame adapters   |
| [`@shiftcut/engine`](packages/engine)                         | Seekable page-to-video capture engine using Puppeteer and FFmpeg  |
| [`@shiftcut/producer`](packages/producer)                     | Full rendering pipeline for capture, encode, and audio mix        |
| [`@shiftcut/studio`](packages/studio)                         | Browser-based composition editor UI                               |
| [`@shiftcut/player`](packages/player)                         | Embeddable `<shiftcut-player>` web component                      |
| [`@shiftcut/shader-transitions`](packages/shader-transitions) | WebGL shader transitions for compositions                         |

## Community

ShiftCut is an independent, open-source project by [Verblike LLC](https://verblike.com), early and building in public. Open a PR if your team is using ShiftCut — see [ADOPTERS.md](ADOPTERS.md).

- Questions and ideas: [Discord](https://discord.gg/EbK98HBPdk)
- Bugs and feature requests: [GitHub Issues](https://github.com/Verblike/shiftcut/issues)
- Security reports: [SECURITY.md](SECURITY.md)
- Contributions: [CONTRIBUTING.md](CONTRIBUTING.md)

## Development Note

The repo uses [Git LFS](https://git-lfs.com) for golden regression-test baselines under `packages/producer/tests/**/output.mp4` (about 240 MB of `.mp4` files). If you're cloning the full repo for development, install Git LFS first:

```bash
# macOS
brew install git-lfs

# Ubuntu / Debian
sudo apt install git-lfs

# Windows
winget install GitHub.GitLFS

# Then, once per machine
git lfs install
```

If you only need source files, you can skip LFS content:

```bash
GIT_LFS_SKIP_SMUDGE=1 git clone https://github.com/Verblike/shiftcut.git
```

## License

[Apache 2.0](LICENSE)
