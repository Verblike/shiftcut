import { initSandboxRuntimeModular } from "./init";
import { installAuthoredOpacityCapture } from "./colorGrading";
import { fitTextFontSize } from "../text/fitTextFontSize";
import { getVariables } from "./getVariables";

type ShiftCutWindow = Window & {
  __shiftcutRuntimeBootstrapped?: boolean;
  __shiftcut?: {
    fitTextFontSize: typeof fitTextFontSize;
    getVariables: typeof getVariables;
  };
};

// Inline composition scripts can run before DOMContentLoaded.
// Ensure timeline registry exists at script evaluation time.
(window as ShiftCutWindow).__timelines = (window as ShiftCutWindow).__timelines || {};

// Stamp color-graded elements with their authored inline opacity BEFORE the
// composition's animation scripts (and the grading hide) mutate it — must run
// at script evaluation time, while the document is still parsing.
installAuthoredOpacityCapture();

// Expose runtime helpers immediately so composition scripts can use them
// before DOMContentLoaded (font sizing runs during script evaluation, and
// getVariables is read by composition setup before the timeline is built).
(window as ShiftCutWindow).__shiftcut = {
  fitTextFontSize,
  getVariables,
};

function bootstrapShiftCutRuntime(): void {
  const win = window as ShiftCutWindow;
  if (win.__shiftcutRuntimeBootstrapped) {
    return;
  }
  win.__shiftcutRuntimeBootstrapped = true;
  initSandboxRuntimeModular();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapShiftCutRuntime, { once: true });
} else {
  bootstrapShiftCutRuntime();
}
