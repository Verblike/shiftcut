---
name: shiftcut-shorts
description: Turn a local podcast, interview, or long talking-head video into several self-contained short clips with transcript-led selects, captions, and vertical reframing.
---

# Shorts

Transcribe locally, identify complete statements with a strong opening and payoff, and propose the candidate segments with timestamps before rendering. Each short should begin cleanly, preserve a complete thought, remove only disruptive silences, and use a 9:16 composition unless the user requests another format.

For each approved segment: ingest the source, trim with handles, apply restrained silence removal, reframe around the speaker, then route to `/embedded-captions` for readable captions. Validate every composition and render locally. Deliver a manifest with source ranges, titles, and output files.
