import { getGooseAnchor, type GooseAnchorSlot, type GoosePreviewMode } from "@/lib/goose-anchors";

export type { GoosePreviewMode } from "@/lib/goose-anchors";

export type GooseLayerKind =
  | "aura_backdrop"
  | "base_body"
  | "head_wear"
  | "eye_wear"
  | "mouth_item"
  | "neck_wear"
  | "hand_prop"
  | "holding_wing"
  | "bill_mask";

export type LayerPosition = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
  zIndex?: number;
};

export type LayerAnchorOffset = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
  zIndex?: number;
};

export const LAYER_KIND_TO_ANCHOR_SLOT: Record<GooseLayerKind, GooseAnchorSlot> = {
  aura_backdrop: "aura",
  base_body: "base",
  head_wear: "head",
  eye_wear: "eyes",
  mouth_item: "mouth",
  neck_wear: "neck",
  hand_prop: "hand",
  holding_wing: "wing",
  bill_mask: "bill"
};

export const LAYER_Z_INDEX: Record<GooseLayerKind, number> = {
  aura_backdrop: 5,
  base_body: 10,
  neck_wear: 28,
  head_wear: 30,
  eye_wear: 34,
  mouth_item: 36,
  hand_prop: 38,
  holding_wing: 42,
  bill_mask: 50
};

const LAYER_KIND_OFFSETS: Record<GoosePreviewMode, Partial<Record<GooseLayerKind, LayerAnchorOffset>>> = {
  full: {
    aura_backdrop: { opacity: 0.68 },
    holding_wing: { scale: 1 },
    bill_mask: { scale: 1 }
  },
  bust: {
    aura_backdrop: { opacity: 0.64 },
    hand_prop: { scale: 0, opacity: 0 },
    holding_wing: { scale: 0, opacity: 0 }
  }
};

export const ITEM_ANCHOR_OFFSETS: Record<GoosePreviewMode, Record<string, LayerAnchorOffset>> = {
  full: {
    "aura_backdrop:smoke": { x: -2, y: 5, scale: 0.93, opacity: 0.48 },
    "aura_backdrop:fire-aura": { x: -3, y: -2, scale: 1.05, opacity: 0.7 },
    "aura_backdrop:hologram-shimmer": { x: -2, y: -5, scale: 1.02, opacity: 0.54 },
    "aura_backdrop:lightning-crackle": { x: -4, y: -3, scale: 1.05, opacity: 0.66 },
    "aura_backdrop:toxic-ooze": { x: -1, y: 6, scale: 0.95, opacity: 0.54 },
    "aura_backdrop:verified-security-glyph": { x: 12, y: 3, scale: 0.8, opacity: 0.72 },
    "head_wear:halo": { y: -4, scale: 0.84 },
    "head_wear:traffic-cone": { y: -1, scale: 0.82 },
    "head_wear:sticky-duck": { y: -3, scale: 0.72 },
    "head_wear:graduation-cap": { x: -2, y: -1, scale: 0.88 },
    "head_wear:tin-foil-hat": { y: -1, scale: 0.78 },
    "head_wear:sombrero": { x: -4, y: 1, scale: 1.23 },
    "head_wear:crown": { scale: 0.92 },
    "eye_wear:sunglasses": { y: 1, scale: 1.04 },
    "eye_wear:laser-visor": { y: 1, scale: 0.86 },
    "eye_wear:sleep-mask": { y: 1, scale: 0.86 },
    "mouth_item:knife": { rotate: -5 },
    "mouth_item:katana": { x: -1, scale: 1.11, rotate: -6 },
    "mouth_item:cigar": { x: 1, scale: 0.82 },
    "mouth_item:spoon": { x: 1, scale: 0.93 },
    "mouth_item:fork": { x: 1, scale: 0.93 },
    "mouth_item:rose": { x: 1, y: -1, rotate: -2 },
    "mouth_item:fish": { scale: 1.04 },
    "mouth_item:whistle": { x: 1, scale: 0.86 },
    "mouth_item:paintbrush": { x: 1, scale: 0.93, rotate: -3 },
    "mouth_item:scroll": { scale: 0.93, rotate: -3 },
    "mouth_item:key": { x: 1, scale: 0.82, rotate: -4 },
    "mouth_item:glow-stick": { x: 1, scale: 0.89, rotate: -5 },
    "hand_prop:baseball-bat": { x: -2, y: -5, scale: 1.03, rotate: -8 },
    "hand_prop:wooden-spoon": { y: -1, scale: 0.9, rotate: -4 },
    "hand_prop:mace": { y: -2, scale: 0.93, rotate: -6 },
    "hand_prop:bottle": { x: 2, scale: 0.87, rotate: -8 },
    "hand_prop:trophy": { x: -3, y: 1, scale: 0.97 },
    "hand_prop:controller": { x: 2, y: 7, scale: 0.87 },
    "hand_prop:clipboard": { y: 1, scale: 0.97 },
    "hand_prop:gavel": { scale: 0.97 },
    "hand_prop:broom": { y: -3, scale: 1.03 },
    "hand_prop:flag": { x: 2, y: -4, rotate: -6 },
    "hand_prop:pizza-peel": { y: 0, scale: 0.97, rotate: -8 },
    "hand_prop:accordion": { x: -2, y: 4, scale: 1.07 },
    "neck_wear:poncho": { y: 1, scale: 0.88 },
    "neck_wear:armor-plate": { x: 1, y: 3, scale: 0.88 },
    "neck_wear:feather-boa": { y: 1, scale: 0.94 },
    "neck_wear:scarf": { x: 1, y: 2, scale: 0.91 }
  },
  bust: {
    "aura_backdrop:smoke": { y: 8, scale: 0.92, opacity: 0.48 },
    "aura_backdrop:fire-aura": { x: -2, scale: 1.04, opacity: 0.68 },
    "aura_backdrop:hologram-shimmer": { x: -1, y: -3, scale: 1.02, opacity: 0.54 },
    "aura_backdrop:lightning-crackle": { x: -2, scale: 1.04, opacity: 0.64 },
    "aura_backdrop:toxic-ooze": { y: 8, scale: 0.94, opacity: 0.52 },
    "aura_backdrop:verified-security-glyph": { x: 16, y: 6, scale: 0.79, opacity: 0.7 },
    "head_wear:halo": { y: -6, scale: 0.82 },
    "head_wear:traffic-cone": { y: -2, scale: 0.82 },
    "head_wear:sticky-duck": { y: -5, scale: 0.72 },
    "head_wear:crown": { scale: 0.86 },
    "eye_wear:sunglasses": { y: 1, scale: 1.03 },
    "eye_wear:sleep-mask": { y: 1, scale: 0.86 },
    "eye_wear:laser-visor": { y: 1, scale: 0.86 },
    "eye_wear:reading-glasses": { y: 1, scale: 0.88 },
    "mouth_item:knife": { rotate: -5 },
    "mouth_item:katana": { x: -1, scale: 1.1, rotate: -6 },
    "mouth_item:cigar": { x: 1, scale: 0.87 },
    "mouth_item:spoon": { x: 1, scale: 0.94 },
    "mouth_item:fork": { x: 1, scale: 0.94 },
    "mouth_item:rose": { y: -1, scale: 1.06, rotate: -2 },
    "mouth_item:fish": { scale: 1.06 },
    "mouth_item:whistle": { x: 1, scale: 0.87 },
    "mouth_item:paintbrush": { x: 1, scale: 0.94, rotate: -3 },
    "mouth_item:scroll": { scale: 0.94, rotate: -3 },
    "mouth_item:key": { x: 2, scale: 0.84, rotate: -4 },
    "mouth_item:glow-stick": { x: 1, scale: 0.94, rotate: -5 },
    "neck_wear:poncho": { y: 1, scale: 0.91 },
    "neck_wear:armor-plate": { x: 1, y: 2, scale: 0.86 },
    "neck_wear:feather-boa": { scale: 0.93 },
    "neck_wear:scarf": { x: 1, y: 1, scale: 0.91 }
  }
};

function applyOffset(anchor: LayerPosition, offset: LayerAnchorOffset | undefined): LayerPosition {
  const scale = offset?.scale ?? 1;
  return {
    x: anchor.x + (offset?.x ?? 0),
    y: anchor.y + (offset?.y ?? 0),
    width: offset?.width ?? ((anchor.width ?? 100) * scale),
    height: offset?.height ?? (anchor.height ? anchor.height * scale : undefined),
    rotate: (anchor.rotate ?? 0) + (offset?.rotate ?? 0),
    opacity: offset?.opacity ?? anchor.opacity,
    zIndex: offset?.zIndex ?? anchor.zIndex
  };
}

export function getLayerPosition(mode: GoosePreviewMode, kind: GooseLayerKind, slug?: string, baseSlug?: string): LayerPosition {
  const slot = LAYER_KIND_TO_ANCHOR_SLOT[kind];
  const anchor = getGooseAnchor(mode, slot, baseSlug);
  const anchoredPosition: LayerPosition = {
    ...anchor,
    zIndex: LAYER_Z_INDEX[kind]
  };
  const kindPosition = applyOffset(anchoredPosition, LAYER_KIND_OFFSETS[mode][kind]);
  return applyOffset(kindPosition, slug ? ITEM_ANCHOR_OFFSETS[mode][`${kind}:${slug}`] : undefined);
}
