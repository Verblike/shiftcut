---
name: shiftcut-reframe
description: Reframe existing local footage for a new aspect ratio, especially 16:9 to 9:16, using subject-aware crop keyframes.
---

# Reframe

Probe the input dimensions and target platform. For a vertical short, default to 1080×1920. Detect faces locally when available; otherwise use the visible speaking subject. Create smooth crop keyframes with restrained motion and safe headroom—never hard-jump between positions.

Keep captions and lower thirds inside platform-safe margins. Preview representative frames, run `shiftcut lint` and `shiftcut check`, then render locally. Report the chosen aspect ratio and any moments where a manual crop decision is needed.
