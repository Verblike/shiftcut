export type ShiftCutPickerBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ShiftCutPickerElementInfo = {
  id: string | null;
  tagName: string;
  selector: string;
  label: string;
  boundingBox: ShiftCutPickerBoundingBox;
  textContent: string | null;
  src: string | null;
  dataAttributes: Record<string, string>;
};

export type ShiftCutPickerApi = {
  enable: () => void;
  disable: () => void;
  isActive: () => boolean;
  getHovered: () => ShiftCutPickerElementInfo | null;
  getSelected: () => ShiftCutPickerElementInfo | null;
  getCandidatesAtPoint: (
    clientX: number,
    clientY: number,
    limit?: number,
  ) => ShiftCutPickerElementInfo[];
  pickAtPoint: (
    clientX: number,
    clientY: number,
    index?: number,
  ) => ShiftCutPickerElementInfo | null;
  pickManyAtPoint: (
    clientX: number,
    clientY: number,
    indexes?: number[],
  ) => ShiftCutPickerElementInfo[];
};

declare global {
  interface Window {
    __HF_PICKER_API?: ShiftCutPickerApi;
  }
}
