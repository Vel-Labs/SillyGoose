export type GoosePreviewMode = "full" | "bust";

export type GooseAnchorSlot = "aura" | "base" | "head" | "eyes" | "bill" | "mouth" | "neck" | "hand" | "wing";

export type GooseAnchorBox = {
  x: number;
  y: number;
  width: number;
  height?: number;
  rotate?: number;
};

export type GooseAnchorSet = Record<GooseAnchorSlot, GooseAnchorBox>;

export const DEFAULT_GOOSE_ANCHORS: Record<GoosePreviewMode, GooseAnchorSet> = {
  full: {
    aura: { x: 6, y: 7, width: 88 },
    base: { x: 18, y: 7, width: 64 },
    head: { x: 29, y: 3, width: 39 },
    eyes: { x: 36, y: 21, width: 26 },
    bill: { x: 44, y: 26, width: 24 },
    mouth: { x: 43, y: 27, width: 28 },
    neck: { x: 30, y: 50, width: 34 },
    hand: { x: 54, y: 42, width: 30 },
    wing: { x: 39, y: 49, width: 38 }
  },
  bust: {
    aura: { x: 2, y: 2, width: 96 },
    base: { x: 16, y: 11, width: 70 },
    head: { x: 25, y: 2, width: 49 },
    eyes: { x: 34, y: 22, width: 32 },
    bill: { x: 46, y: 32, width: 28 },
    mouth: { x: 45, y: 33, width: 31 },
    neck: { x: 27, y: 56, width: 43 },
    hand: { x: 0, y: 0, width: 0 },
    wing: { x: 0, y: 0, width: 0 }
  }
};

export const BASE_GOOSE_ANCHOR_OVERRIDES: Partial<Record<GoosePreviewMode, Record<string, Partial<GooseAnchorSet>>>> = {};

export function getGooseAnchor(mode: GoosePreviewMode, slot: GooseAnchorSlot, baseSlug?: string): GooseAnchorBox {
  const baseAnchor = DEFAULT_GOOSE_ANCHORS[mode][slot];
  const baseOverride = baseSlug ? BASE_GOOSE_ANCHOR_OVERRIDES[mode]?.[baseSlug]?.[slot] : undefined;
  return {
    ...baseAnchor,
    ...baseOverride
  };
}
