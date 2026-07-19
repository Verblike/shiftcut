export const SHIFTCUT_RUNTIME_GLOBALS = {
  player: "__player",
  playerReady: "__playerReady",
  renderReady: "__renderReady",
  timelines: "__timelines",
  clipManifest: "__clipManifest",
} as const;

export const SHIFTCUT_BRIDGE_SOURCES = {
  parent: "hf-parent",
  preview: "hf-preview",
} as const;

export const SHIFTCUT_CONTROL_ACTIONS = [
  "play",
  "pause",
  "seek",
  "set-muted",
  "set-playback-rate",
  "set-color-grading",
  "set-color-grading-compare",
  "enable-pick-mode",
  "disable-pick-mode",
] as const;

export type ShiftCutControlAction = (typeof SHIFTCUT_CONTROL_ACTIONS)[number];
