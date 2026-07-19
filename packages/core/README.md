# @shiftcut/core

Types, parsers, generators, compiler, linter, runtime, and frame adapters for the Shiftcut video framework.

## Install

```bash
npm install @shiftcut/core
```

> Most users don't need to install core directly — the [CLI](../cli), [producer](../producer), and [studio](../studio) packages depend on it internally.

## What's inside

| Module             | Description                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| **Types**          | `TimelineElement`, `CompositionSpec`, `Asset`, canvas dimensions, defaults                           |
| **Parsers**        | `parseHtml` — extract timeline elements from HTML; `parseGsapScript` — parse GSAP animations         |
| **Generators**     | `generateShiftcutHtml` — produce valid Shiftcut HTML from a composition spec                         |
| **Compiler**       | `compileTimingAttrs` — resolve `data-start` / `data-duration` into absolute times                    |
| **Linter**         | `lintShiftCutHtml` — validate Shiftcut HTML (missing attributes, overlapping tracks, etc.)           |
| **Runtime**        | IIFE script injected into the browser — manages seek, media playback, and the `window.__hf` protocol |
| **Frame Adapters** | Pluggable animation drivers (GSAP, Lottie, CSS, or custom)                                           |

## Frame Adapters

A frame adapter tells the engine how to seek your animation to a specific frame:

```typescript
import { createGSAPFrameAdapter } from "@shiftcut/core";

const adapter = createGSAPFrameAdapter({
  getTimeline: () => gsap.timeline(),
  compositionId: "my-video",
});
```

Implement `FrameAdapter` for custom animation runtimes:

```typescript
import type { FrameAdapter } from "@shiftcut/core";

const myAdapter: FrameAdapter = {
  id: "my-adapter",
  getDurationFrames: () => 300,
  seekFrame: (frame) => {
    /* seek your animation */
  },
};
```

## Parsing and generating HTML

```typescript
import { parseHtml, generateShiftcutHtml } from "@shiftcut/core";

const { elements, metadata } = parseHtml(htmlString);
const html = generateShiftcutHtml(spec);
```

## Linting

```typescript
import { lintShiftCutHtml } from "@shiftcut/core/lint";

const result = lintShiftCutHtml(htmlString);
// result.findings: { severity, message, elementId }[]
```

## Documentation

Full documentation: [shiftcut.verblike.com/packages/core](https://shiftcut.verblike.com/packages/core)

## Related packages

- [`@shiftcut/engine`](../engine) — rendering engine that drives the browser
- [`@shiftcut/producer`](../producer) — full render pipeline (capture + encode)
- [`shiftcut`](../cli) — CLI
