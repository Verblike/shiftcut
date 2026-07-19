---
name: shiftcut-ingest
description: Import an existing local video into a deterministic ShiftCut composition. Use before an editing workflow when the user supplies a video file and needs an editable project.
---

# ShiftCut Ingest

Work locally. Probe the source with `ffprobe`, copy or symlink it into the project as `source.mp4`, then create a composition whose video clip starts at zero and spans the measured duration. Preserve the source bytes; never transcode until the requested edit requires it.

Run `shiftcut init <project> --video <file>` when available. Otherwise create an HTML composition with the standard `data-composition-id`, `class="clip"`, `data-start`, `data-duration`, and `data-track-index` contract. Validate with `shiftcut lint` and `shiftcut check` before handing off to another workflow.
