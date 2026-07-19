---
name: shiftcut-remove-silences
description: Remove silent pauses and specified filler words from local spoken-video footage while preserving natural pacing.
---

# Remove Silences

Start by transcribing locally with `shiftcut transcribe` and measure silence from the audio track. Keep short breathing pauses; only remove pauses longer than the user-selected threshold (default 0.7 seconds). Treat filler-word removal as transcript-guided cuts, leaving handle frames around each cut.

Produce an edit decision list with original and output timestamps, then compile it into a ShiftCut composition. Add 2–4 frame audio/video crossfades at every cut, preserve lip-sync, and validate the composition before rendering. Never use a cloud transcription or editing service.
