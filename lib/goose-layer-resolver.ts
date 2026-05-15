import type { CosmeticItem, GooseLoadout } from "@/lib/goose-cosmetics";
import {
  getLayerPosition,
  LAYER_KIND_TO_ANCHOR_SLOT,
  LAYER_Z_INDEX,
  type GooseLayerKind,
  type GoosePreviewMode,
  type LayerPosition
} from "@/lib/goose-layer-positions";

export type ResolvedGooseLayer = {
  key: string;
  kind: GooseLayerKind;
  anchorSlot: string;
  category: string;
  slug: string;
  src: string;
  zIndex: number;
  position: LayerPosition;
  required?: boolean;
};

export type GooseLayerResolution = {
  layers: ResolvedGooseLayer[];
  warnings: string[];
  selectedSlugs: Record<string, string | null | undefined>;
  omitted: string[];
};

export type GooseLayerResolveOptions = {
  showBillOverlay?: boolean;
  showWingOverlay?: boolean;
};

type LayerSelection = {
  kind: GooseLayerKind;
  loadoutField: keyof GooseLoadout;
};

const generatedBaseSlugs = new Set(["classic", "golden", "zombie", "holographic", "robotic"]);
const supportedStandaloneCategories = new Set(["hat", "eyes", "bill_item", "held_item", "neck", "aura"]);
const generatedCosmeticSlugs = new Set([
  "crown",
  "fireman-helmet",
  "sombrero",
  "top-hat",
  "beanie",
  "bandana",
  "punk-mohawk",
  "sticky-duck",
  "traffic-cone",
  "chef-hat",
  "pirate-hat",
  "halo",
  "devil-horns",
  "visor",
  "tin-foil-hat",
  "graduation-cap",
  "sunglasses",
  "monocle",
  "three-d-glasses",
  "eyepatch",
  "laser-visor",
  "reading-glasses",
  "sleep-mask",
  "heart-glasses",
  "cyber-visor",
  "knife",
  "katana",
  "cigar",
  "spoon",
  "fork",
  "rose",
  "fish",
  "whistle",
  "paintbrush",
  "scroll",
  "key",
  "glow-stick",
  "baseball-bat",
  "wooden-spoon",
  "mace",
  "bottle",
  "trophy",
  "microphone",
  "lantern",
  "controller",
  "clipboard",
  "gavel",
  "broom",
  "flag",
  "pizza-peel",
  "accordion",
  "poncho",
  "bow-tie",
  "spike-collar",
  "gold-chain",
  "medal",
  "scarf",
  "security-badge",
  "armor-plate",
  "feather-boa",
  "fire-aura",
  "hologram-shimmer",
  "lightning-crackle",
  "smoke",
  "crown-glow",
  "achievement-sparkle",
  "toxic-ooze",
  "heart-particles",
  "verified-security-glyph"
]);

const cosmeticSelections: LayerSelection[] = [
  { kind: "aura_backdrop", loadoutField: "auraItemId" },
  { kind: "neck_wear", loadoutField: "neckItemId" },
  { kind: "head_wear", loadoutField: "hatItemId" },
  { kind: "eye_wear", loadoutField: "eyesItemId" },
  { kind: "mouth_item", loadoutField: "billItemId" },
  { kind: "hand_prop", loadoutField: "heldItemId" }
];

function baseAssetPath(baseSlug: string, variant: "full" | "bust" | "wing-hold" | "bill") {
  return `/goose-assets/bases/${baseSlug}/${variant}.png`;
}

function normalizePublicAssetPath(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  if (path.startsWith("goose-assets/")) return `/${path}`;
  return null;
}

function resolveBaseSlug(loadout: GooseLoadout, cosmeticsBySlug: Record<string, CosmeticItem>, warnings: string[]) {
  const requestedBase = loadout.baseItemId ?? "classic";
  const item = cosmeticsBySlug[requestedBase];
  if (!item || item.category !== "base") {
    warnings.push(`Base ${requestedBase} is not in the cosmetic catalog; falling back to classic.`);
    return "classic";
  }
  if (!generatedBaseSlugs.has(requestedBase)) {
    warnings.push(`Base ${requestedBase} has no generated layered assets; falling back to classic.`);
    return "classic";
  }
  return requestedBase;
}

function semanticCategoryFor(kind: GooseLayerKind) {
  switch (kind) {
    case "aura_backdrop":
      return "aura";
    case "head_wear":
      return "hat";
    case "eye_wear":
      return "eyes";
    case "mouth_item":
      return "bill_item";
    case "hand_prop":
      return "held_item";
    case "neck_wear":
      return "neck";
    default:
      return "base";
  }
}

export function resolveGooseLayers(
  mode: GoosePreviewMode,
  loadout: GooseLoadout,
  cosmeticsBySlug: Record<string, CosmeticItem>,
  options: GooseLayerResolveOptions = {}
): GooseLayerResolution {
  const warnings: string[] = [];
  const omitted: string[] = [];
  const layers: ResolvedGooseLayer[] = [];
  const baseSlug = resolveBaseSlug(loadout, cosmeticsBySlug, warnings);
  const selectedSlugs = {
    base: baseSlug,
    hat: loadout.hatItemId,
    neck: loadout.neckItemId,
    eyes: loadout.eyesItemId,
    bill_item: loadout.billItemId,
    held_item: loadout.heldItemId,
    aura: loadout.auraItemId
  };

  function canRenderLayerInMode(kind: GooseLayerKind) {
    if (mode === "bust" && (kind === "hand_prop" || kind === "holding_wing")) return false;
    return true;
  }

  function pushLayer(params: {
    kind: GooseLayerKind;
    category: string;
    slug: string;
    src: string | null;
    required?: boolean;
  }) {
    if (!canRenderLayerInMode(params.kind)) {
      omitted.push(`${params.kind} is not eligible in ${mode} mode.`);
      return;
    }
    if (!params.src) {
      const message = `${params.required ? "Required" : "Optional"} ${params.kind} layer for ${params.slug} has no usable asset path.`;
      if (params.required) warnings.push(message);
      else omitted.push(message);
      return;
    }
    const position = getLayerPosition(mode, params.kind, params.slug, baseSlug);
    if (position.opacity === 0 || position.width === 0) {
      omitted.push(`${params.kind} is intentionally omitted in ${mode} mode.`);
      return;
    }
    layers.push({
      key: `${params.kind}-${params.slug}`,
      kind: params.kind,
      anchorSlot: LAYER_KIND_TO_ANCHOR_SLOT[params.kind],
      category: params.category,
      slug: params.slug,
      src: params.src,
      zIndex: position.zIndex ?? LAYER_Z_INDEX[params.kind],
      position,
      required: params.required
    });
  }

  pushLayer({
    kind: "base_body",
    category: "base",
    slug: baseSlug,
    src: baseAssetPath(baseSlug, mode === "full" ? "full" : "bust"),
    required: true
  });

  for (const selection of cosmeticSelections) {
    const slug = loadout[selection.loadoutField];
    if (!slug || typeof slug !== "string") continue;
    if (!canRenderLayerInMode(selection.kind)) {
      omitted.push(`Held item ${slug} is full-body only.`);
      continue;
    }
    const item = cosmeticsBySlug[slug];
    if (!item) {
      omitted.push(`Cosmetic ${slug} is not in the catalog.`);
      continue;
    }
    if (!supportedStandaloneCategories.has(item.category)) {
      omitted.push(`Cosmetic ${slug} uses category ${item.category}, which is not a composable PNG layer yet.`);
      continue;
    }
    if (!generatedCosmeticSlugs.has(item.slug)) {
      omitted.push(`Cosmetic ${slug} has no generated standalone PNG yet.`);
      continue;
    }
    const expectedCategory = semanticCategoryFor(selection.kind);
    if (item.category !== expectedCategory) {
      omitted.push(`Cosmetic ${slug} is ${item.category}, not ${expectedCategory}; skipping mismatched semantic layer.`);
      continue;
    }
    pushLayer({
      kind: selection.kind,
      category: item.category,
      slug: item.slug,
      src: normalizePublicAssetPath(item.assetPath)
    });
  }

  const shouldShowWingOverlay = options.showWingOverlay ?? true;
  const shouldShowBillOverlay = options.showBillOverlay ?? Boolean(loadout.eyesItemId || loadout.billItemId);

  if (mode === "full" && loadout.heldItemId && shouldShowWingOverlay) {
    pushLayer({
      kind: "holding_wing",
      category: "base",
      slug: baseSlug,
      src: baseAssetPath(baseSlug, "wing-hold")
    });
  }

  if (shouldShowBillOverlay) {
    pushLayer({
      kind: "bill_mask",
      category: "base",
      slug: baseSlug,
      src: baseAssetPath(baseSlug, "bill")
    });
  } else {
    omitted.push("Bill overlay hidden because no eyes or bill item are selected.");
  }

  return {
    layers: layers.sort((a, b) => a.zIndex - b.zIndex),
    warnings,
    selectedSlugs,
    omitted
  };
}

export function resolveCosmeticThumbnail(item: CosmeticItem) {
  if (item.category === "base" && !generatedBaseSlugs.has(item.slug)) return null;
  if (item.category !== "base" && !generatedCosmeticSlugs.has(item.slug)) return null;
  return normalizePublicAssetPath(item.assetPath) ?? normalizePublicAssetPath(item.previewPath);
}
