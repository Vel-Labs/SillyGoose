import { gooseRoster, type GooseKey } from "@/lib/goose-roster";

export type CosmeticCategory =
  | "base"
  | "hat"
  | "eyes"
  | "bill_item"
  | "held_item"
  | "neck"
  | "badge"
  | "ribbon"
  | "aura"
  | "frame"
  | "background";

export type CosmeticRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | "event";

export type CosmeticUnlockType = "default" | "achievement" | "streak" | "purchase" | "admin_grant" | "event" | "legacy";

export type CosmeticItem = {
  id?: string;
  slug: string;
  name: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  assetPath?: string | null;
  previewPath?: string | null;
  headshotPath?: string | null;
  layerOrder: number;
  tags: string[];
  unlockType: CosmeticUnlockType;
  unlockRuleJson: Record<string, unknown>;
  isActive: boolean;
  isPremium: boolean;
  sortOrder: number;
};

export type GooseLoadout = {
  id: string;
  userId: string;
  slotIndex: 1 | 2 | 3;
  name: string;
  title?: string | null;
  honkline?: string | null;
  baseItemId?: string | null;
  hatItemId?: string | null;
  eyesItemId?: string | null;
  billItemId?: string | null;
  heldItemId?: string | null;
  neckItemId?: string | null;
  badgeItemId?: string | null;
  ribbonItemId?: string | null;
  auraItemId?: string | null;
  frameItemId?: string | null;
  backgroundItemId?: string | null;
  compositeAssetPath?: string | null;
  headshotAssetPath?: string | null;
  isActive: boolean;
  isPreset?: boolean;
  presetSlug?: string | null;
};

export type AchievementCatalogItem = {
  slug: string;
  name: string;
  description: string;
  rewardCosmeticSlug?: string;
  ruleJson: Record<string, unknown>;
  points: number;
};

export const GOOSE_ASSET_BUCKET = "goose-assets";

export const GOOSE_ASSET_FOLDERS = {
  bases: "bases",
  hats: "hats",
  eyes: "eyes",
  billItems: "bill-items",
  heldItems: "held-items",
  neck: "neck",
  badges: "badges",
  ribbons: "ribbons",
  auras: "auras",
  frames: "frames",
  backgrounds: "backgrounds",
  userComposites: "composites/user-loadouts",
  userHeadshots: "headshots/user-loadouts"
} as const;

const layerOrderByCategory: Record<CosmeticCategory, number> = {
  background: 0,
  aura: 10,
  base: 20,
  neck: 30,
  eyes: 40,
  bill_item: 50,
  held_item: 60,
  hat: 70,
  badge: 80,
  ribbon: 90,
  frame: 100
};

let itemSortOrder = 0;

function item(
  slug: string,
  name: string,
  category: CosmeticCategory,
  rarity: CosmeticRarity,
  tags: string[],
  assetPath: string,
  unlockType: CosmeticUnlockType = "default",
  unlockRuleJson: Record<string, unknown> = {},
  paths: Pick<CosmeticItem, "previewPath" | "headshotPath"> = {}
): CosmeticItem {
  return {
    slug,
    name,
    category,
    rarity,
    tags,
    assetPath,
    previewPath: paths.previewPath,
    headshotPath: paths.headshotPath,
    layerOrder: layerOrderByCategory[category],
    unlockType,
    unlockRuleJson,
    isActive: true,
    isPremium: false,
    sortOrder: itemSortOrder++
  };
}

// Composition contract: assetPath is the standalone layer candidate,
// previewPath is for picker/UI previews only, and headshotPath is a profile/bust display candidate.
function baseAssetPath(slug: string, variant: "full" | "bust" | "wing-hold" | "bill") {
  return `/goose-assets/bases/${slug}/${variant}.png`;
}

function cosmeticAssetPath(folder: string, slug: string, variant: "standalone" | "bust-preview" = "standalone") {
  const suffix = variant === "bust-preview" ? "-bust-preview" : "";
  return `/goose-assets/${folder}/${slug}${suffix}.png`;
}

function generatedItem(
  slug: string,
  name: string,
  category: Extract<CosmeticCategory, "hat" | "eyes" | "bill_item" | "held_item" | "neck" | "aura">,
  folder: string,
  rarity: CosmeticRarity,
  tags: string[],
  unlockType: CosmeticUnlockType = "default",
  unlockRuleJson: Record<string, unknown> = {}
) {
  return item(slug, name, category, rarity, tags, cosmeticAssetPath(folder, slug), unlockType, unlockRuleJson, {
    previewPath: cosmeticAssetPath(folder, slug, "bust-preview")
  });
}

export const starterCosmeticCatalog: CosmeticItem[] = [];

starterCosmeticCatalog.push(
  item("classic", "Classic Goose", "base", "common", ["starter", "stock"], baseAssetPath("classic", "full"), "default", {}, { previewPath: baseAssetPath("classic", "bust"), headshotPath: baseAssetPath("classic", "bust") }),
  item("golden", "Golden Goose", "base", "rare", ["shiny", "winner"], baseAssetPath("golden", "full"), "default", {}, { previewPath: baseAssetPath("golden", "bust"), headshotPath: baseAssetPath("golden", "bust") }),
  item("zombie", "Zombie Goose", "base", "event", ["undead", "haunted"], baseAssetPath("zombie", "full"), "event", {}, { previewPath: baseAssetPath("zombie", "bust"), headshotPath: baseAssetPath("zombie", "bust") }),
  item("holographic", "Holographic Goose", "base", "epic", ["glow", "security"], baseAssetPath("holographic", "full"), "default", {}, { previewPath: baseAssetPath("holographic", "bust"), headshotPath: baseAssetPath("holographic", "bust") }),
  item("robotic", "Robotic Goose", "base", "epic", ["machine", "ledger"], baseAssetPath("robotic", "full"), "default", {}, { previewPath: baseAssetPath("robotic", "bust"), headshotPath: baseAssetPath("robotic", "bust") }),
  item("inferno", "Inferno Goose", "base", "legendary", ["streak", "fire"], "goose-assets/bases/inferno/full.png", "streak", { winsInRow: 10 }),
  item("ghost", "Ghost Goose", "base", "rare", ["spectral", "sneaky"], "goose-assets/bases/ghost/full.png"),
  item("void", "Void Goose", "base", "mythic", ["cosmic", "ominous"], "goose-assets/bases/void/full.png"),

  generatedItem("crown", "Crown", "hat", "hats", "rare", ["royal", "ego", "authority"]),
  generatedItem("fireman-helmet", "Fireman Helmet", "hat", "hats", "epic", ["streak", "rescue"], "achievement", { achievement: "streak-snuffer" }),
  generatedItem("sombrero", "Sombrero", "hat", "hats", "uncommon", ["party", "sun"]),
  generatedItem("top-hat", "Top Hat", "hat", "hats", "rare", ["formal", "duel"]),
  generatedItem("beanie", "Beanie", "hat", "hats", "common", ["intern", "cold"]),
  generatedItem("bandana", "Bandana", "hat", "hats", "common", ["scrappy", "arcade"]),
  generatedItem("punk-mohawk", "Punk Mohawk", "hat", "hats", "rare", ["punk", "warning"]),
  generatedItem("sticky-duck", "Sticky Duck", "hat", "hats", "event", ["sticky", "pond"], "achievement", { achievement: "sticky-duck" }),
  generatedItem("traffic-cone", "Traffic Cone", "hat", "hats", "uncommon", ["hazard", "construction"]),
  generatedItem("chef-hat", "Chef Hat", "hat", "hats", "uncommon", ["kitchen", "spoon"]),
  generatedItem("pirate-hat", "Pirate Hat", "hat", "hats", "rare", ["pirate", "rival"]),
  generatedItem("halo", "Halo", "hat", "hats", "event", ["angelic", "pond"]),
  generatedItem("devil-horns", "Devil Horns", "hat", "hats", "rare", ["mischief", "rival"]),
  generatedItem("visor", "Visor", "hat", "hats", "common", ["sports", "shade"]),
  generatedItem("tin-foil-hat", "Tin Foil Hat", "hat", "hats", "rare", ["paranoid", "signal"]),
  generatedItem("graduation-cap", "Graduation Cap", "hat", "hats", "uncommon", ["graduate", "learned"]),

  generatedItem("sunglasses", "Sunglasses", "eyes", "eyes", "common", ["cool", "shade"]),
  generatedItem("monocle", "Monocle", "eyes", "eyes", "rare", ["diplomatic", "formal"], "achievement", { achievement: "diplomatic-menace" }),
  generatedItem("three-d-glasses", "3D Glasses", "eyes", "eyes", "common", ["retro", "cinema"]),
  generatedItem("eyepatch", "Eyepatch", "eyes", "eyes", "uncommon", ["pirate", "rival"]),
  generatedItem("laser-visor", "Laser Visor", "eyes", "eyes", "epic", ["laser", "arcade"]),
  generatedItem("reading-glasses", "Reading Glasses", "eyes", "eyes", "common", ["bookish", "formal"]),
  generatedItem("sleep-mask", "Sleep Mask", "eyes", "eyes", "common", ["sleepy", "cozy"]),
  generatedItem("heart-glasses", "Heart Glasses", "eyes", "eyes", "uncommon", ["cute", "chaos"]),
  generatedItem("cyber-visor", "Cyber Visor", "eyes", "eyes", "epic", ["cyber", "ledger"]),

  generatedItem("knife", "Knife", "bill_item", "bill-items", "rare", ["cutlery", "menace"]),
  generatedItem("katana", "Katana", "bill_item", "bill-items", "epic", ["blade", "duel"]),
  generatedItem("cigar", "Cigar", "bill_item", "bill-items", "rare", ["boss", "noir"]),
  generatedItem("spoon", "Spoon", "bill_item", "bill-items", "common", ["soup", "ceremony"]),
  generatedItem("fork", "Fork", "bill_item", "bill-items", "common", ["cutlery", "snack"]),
  generatedItem("rose", "Rose", "bill_item", "bill-items", "uncommon", ["romance", "diplomacy"]),
  generatedItem("fish", "Fish", "bill_item", "bill-items", "uncommon", ["pond", "snack"]),
  generatedItem("whistle", "Whistle", "bill_item", "bill-items", "common", ["referee", "match"]),
  generatedItem("paintbrush", "Paintbrush", "bill_item", "bill-items", "common", ["paint", "creative"]),
  generatedItem("scroll", "Scroll", "bill_item", "bill-items", "uncommon", ["contract", "ceremony"]),
  generatedItem("key", "Ledger Security Key", "bill_item", "bill-items", "epic", ["security", "webauthn"]),
  generatedItem("glow-stick", "Glow Stick", "bill_item", "bill-items", "event", ["rave", "night"], "event"),

  generatedItem("baseball-bat", "Baseball Bat", "held_item", "held-items", "uncommon", ["sports", "warning"]),
  generatedItem("wooden-spoon", "Wooden Spoon", "held_item", "held-items", "common", ["kitchen", "soup"]),
  generatedItem("mace", "Mace", "held_item", "held-items", "epic", ["medieval", "danger"]),
  generatedItem("bottle", "Bottle", "held_item", "held-items", "common", ["green", "stage"]),
  generatedItem("trophy", "Trophy", "held_item", "held-items", "rare", ["winner", "brag"]),
  generatedItem("microphone", "Microphone", "held_item", "held-items", "common", ["music", "noise"]),
  generatedItem("lantern", "Lantern", "held_item", "held-items", "uncommon", ["light", "night"]),
  generatedItem("controller", "Controller", "held_item", "held-items", "common", ["arcade", "game"]),
  generatedItem("clipboard", "Clipboard", "held_item", "held-items", "common", ["enterprise", "audit"]),
  generatedItem("gavel", "Gavel", "held_item", "held-items", "rare", ["authority", "verdict"]),
  generatedItem("broom", "Broom", "held_item", "held-items", "uncommon", ["clean", "sweep"]),
  generatedItem("flag", "Flag", "held_item", "held-items", "common", ["signal", "team"]),
  generatedItem("pizza-peel", "Pizza Peel", "held_item", "held-items", "uncommon", ["kitchen", "pizza"]),
  generatedItem("accordion", "Accordion", "held_item", "held-items", "event", ["music", "noise"]),

  generatedItem("poncho", "Poncho", "neck", "neck", "uncommon", ["western", "rain"]),
  generatedItem("bow-tie", "Bow Tie", "neck", "neck", "common", ["formal", "tiny"]),
  generatedItem("spike-collar", "Spike Collar", "neck", "neck", "rare", ["punk", "warning"]),
  generatedItem("gold-chain", "Gold Chain", "neck", "neck", "rare", ["bling", "winner"]),
  generatedItem("medal", "Medal", "neck", "neck", "uncommon", ["winner", "award"]),
  generatedItem("scarf", "Scarf", "neck", "neck", "common", ["cozy", "winter"]),
  generatedItem("security-badge", "Security Badge", "neck", "neck", "epic", ["ledger", "verified"]),
  generatedItem("armor-plate", "Armor Plate", "neck", "neck", "epic", ["tank", "defense"]),
  generatedItem("feather-boa", "Feather Boa", "neck", "neck", "event", ["fancy", "stage"]),

  item("verified-competitor", "Verified Competitor", "badge", "common", ["webauthn", "first-match"], "goose-assets/badges/verified-competitor.png", "achievement", { achievement: "verified-competitor" }),
  item("pond-regular", "Pond Regular", "ribbon", "uncommon", ["streak", "loyalty"], "goose-assets/ribbons/pond-regular.png", "achievement", { achievement: "pond-regular" }),
  item("clean-sweep", "Clean Sweep", "badge", "rare", ["winner", "broom"], "goose-assets/badges/clean-sweep.png", "achievement", { achievement: "clean-sweep" }),
  item("streak-snuffer", "Streak Snuffer", "badge", "epic", ["rival", "fire"], "goose-assets/badges/streak-snuffer.png", "achievement", { achievement: "streak-snuffer" }),
  item("flock-founder", "Flock Founder", "ribbon", "event", ["legacy", "founder"], "goose-assets/ribbons/flock-founder.png", "legacy"),
  item("referral-ribbon", "Referral Ribbon", "ribbon", "uncommon", ["invite", "social"], "goose-assets/ribbons/referral-ribbon.png"),
  item("human-verified", "Human Verified", "badge", "common", ["security-key", "proof"], "goose-assets/badges/human-verified.png"),

  generatedItem("fire-aura", "Fire Aura", "aura", "auras", "legendary", ["streak", "hot"], "achievement", { achievement: "hot-beak" }),
  generatedItem("hologram-shimmer", "Hologram Shimmer", "aura", "auras", "epic", ["hologram", "glow"]),
  generatedItem("lightning-crackle", "Lightning Crackle", "aura", "auras", "epic", ["storm", "fast"]),
  generatedItem("smoke", "Smoke", "aura", "auras", "rare", ["mystery", "stage"]),
  generatedItem("crown-glow", "Crown Glow", "aura", "auras", "rare", ["royal", "shine"]),
  generatedItem("achievement-sparkle", "Achievement Sparkle", "aura", "auras", "uncommon", ["shine", "celebration"]),
  generatedItem("toxic-ooze", "Toxic Ooze", "aura", "auras", "event", ["slime", "hazard"], "event"),
  generatedItem("heart-particles", "Heart Particles", "aura", "auras", "uncommon", ["cute", "social"]),
  generatedItem("verified-security-glyph", "Verified Security Glyph", "aura", "auras", "epic", ["security", "webauthn"]),
  item("hologram-glow", "Hologram Glow", "aura", "epic", ["legacy", "hologram", "glow"], "goose-assets/auras/hologram-glow.png"),
  item("sparkles", "Sparkles", "aura", "uncommon", ["legacy", "shine", "celebration"], "goose-assets/auras/sparkles.png"),
  item("moon-pond", "Moon Pond", "aura", "rare", ["night", "quiet"], "goose-assets/auras/moon-pond.png")
);

export const starterAchievementCatalog: AchievementCatalogItem[] = [
  {
    slug: "verified-competitor",
    name: "Verified Competitor",
    description: "Finish your first human-verified match.",
    rewardCosmeticSlug: "verified-competitor",
    ruleJson: { stat: "matchesPlayed", atLeast: 1 },
    points: 10
  },
  {
    slug: "pond-regular",
    name: "Pond Regular",
    description: "Play three days in a row.",
    rewardCosmeticSlug: "pond-regular",
    ruleJson: { stat: "dailyPlayStreak", atLeast: 3 },
    points: 25
  },
  {
    slug: "clean-sweep",
    name: "Clean Sweep",
    description: "Win a match decisively.",
    rewardCosmeticSlug: "clean-sweep",
    ruleJson: { stat: "decisiveWins", atLeast: 1 },
    points: 30
  },
  {
    slug: "streak-snuffer",
    name: "Streak Snuffer",
    description: "End another player's five-win streak.",
    rewardCosmeticSlug: "fireman-helmet",
    ruleJson: { stat: "opponentStreakEnded", atLeast: 5 },
    points: 50
  },
  {
    slug: "hot-beak",
    name: "Hot Beak",
    description: "Win five games in a row.",
    rewardCosmeticSlug: "fire-aura",
    ruleJson: { stat: "winStreak", atLeast: 5 },
    points: 50
  },
  {
    slug: "full-inferno",
    name: "Full Inferno",
    description: "Win ten games in a row.",
    rewardCosmeticSlug: "inferno",
    ruleJson: { stat: "winStreak", atLeast: 10 },
    points: 100
  },
  {
    slug: "diplomatic-menace",
    name: "Diplomatic Menace",
    description: "Draw five games.",
    rewardCosmeticSlug: "monocle",
    ruleJson: { stat: "draws", atLeast: 5 },
    points: 20
  },
  {
    slug: "sticky-duck",
    name: "Sticky Duck",
    description: "Keep showing up to the pond for three straight days.",
    rewardCosmeticSlug: "sticky-duck",
    ruleJson: { stat: "dailyPlayStreak", atLeast: 3 },
    points: 25
  }
];

export function groupCosmeticsByCategory(items: CosmeticItem[]) {
  return items.reduce<Record<CosmeticCategory, CosmeticItem[]>>((groups, cosmetic) => {
    groups[cosmetic.category].push(cosmetic);
    groups[cosmetic.category].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return groups;
  }, {
    base: [],
    hat: [],
    eyes: [],
    bill_item: [],
    held_item: [],
    neck: [],
    badge: [],
    ribbon: [],
    aura: [],
    frame: [],
    background: []
  });
}

export function getCosmeticAssetUrl(itemOrPath?: CosmeticItem | string | null) {
  const path = typeof itemOrPath === "string" ? itemOrPath : itemOrPath?.previewPath ?? itemOrPath?.assetPath;
  if (!path) return null;
  if (path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://")) return path;
  const storageBase = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL?.replace(/\/$/, "");
  if (storageBase) return `${storageBase}/${path.replace(/^goose-assets\//, "")}`;
  return null;
}

export function getLoadoutLayers(loadout: GooseLoadout, items: CosmeticItem[] = starterCosmeticCatalog) {
  const bySlug = new Map(items.map((cosmetic) => [cosmetic.slug, cosmetic]));
  const selectedSlugs = [
    loadout.backgroundItemId,
    loadout.auraItemId,
    loadout.baseItemId,
    loadout.neckItemId,
    loadout.eyesItemId,
    loadout.billItemId,
    loadout.heldItemId,
    loadout.hatItemId,
    loadout.badgeItemId,
    loadout.ribbonItemId,
    loadout.frameItemId
  ].filter(Boolean) as string[];
  return selectedSlugs
    .map((slug) => bySlug.get(slug))
    .filter((cosmetic): cosmetic is CosmeticItem => Boolean(cosmetic))
    .sort((a, b) => a.layerOrder - b.layerOrder);
}

export function getDefaultLoadout(userId: string, slotIndex: 1 | 2 | 3, goose: GooseKey = "captain"): GooseLoadout {
  const rosterGoose = gooseRoster.find((candidate) => candidate.key === goose) ?? gooseRoster[0];
  return {
    id: `local-${userId}-${slotIndex}`,
    userId,
    slotIndex,
    name: slotIndex === 1 ? rosterGoose.shortName : "Untitled Goose",
    title: slotIndex === 1 ? rosterGoose.role : null,
    honkline: slotIndex === 1 ? rosterGoose.catchphrase : null,
    baseItemId: "classic",
    hatItemId: slotIndex === 1 ? "crown" : null,
    eyesItemId: null,
    billItemId: null,
    heldItemId: null,
    neckItemId: null,
    badgeItemId: "human-verified",
    ribbonItemId: null,
    auraItemId: null,
    frameItemId: null,
    backgroundItemId: null,
    compositeAssetPath: rosterGoose.image,
    headshotAssetPath: rosterGoose.image,
    isActive: slotIndex === 1,
    isPreset: true,
    presetSlug: rosterGoose.key
  };
}

export function getHonklineFallback(loadout: Pick<GooseLoadout, "honkline" | "baseItemId" | "hatItemId">) {
  if (loadout.honkline?.trim()) return loadout.honkline.trim();
  if (loadout.hatItemId === "crown") return "Royal decree: honk first, justify later.";
  if (loadout.baseItemId === "inferno") return "Compliance reviewed. Pond on fire.";
  return "Honkline pending legal review.";
}

export function validateLoadoutSlots(loadouts: GooseLoadout[]) {
  const slots = new Set(loadouts.map((loadout) => loadout.slotIndex));
  const activeCount = loadouts.filter((loadout) => loadout.isActive).length;
  return {
    validSlotCount: loadouts.length <= 3 && slots.size === loadouts.length,
    validSlotIndexes: loadouts.every((loadout) => loadout.slotIndex >= 1 && loadout.slotIndex <= 3),
    hasOneActive: activeCount === 1
  };
}

export function canEquipCosmetic(item: CosmeticItem, unlockedSlugs: Set<string>) {
  return item.unlockType === "default" || item.unlockType === "legacy" || unlockedSlugs.has(item.slug);
}

export function deriveLoadoutTitleFromTraits(loadout: GooseLoadout, items: CosmeticItem[] = starterCosmeticCatalog) {
  const layers = getLoadoutLayers(loadout, items);
  const rarest = layers.find((layer) => ["mythic", "legendary", "event", "epic"].includes(layer.rarity));
  if (loadout.title?.trim()) return loadout.title.trim();
  if (rarest?.category === "aura") return `${rarest.name} Menace`;
  if (rarest?.category === "base") return `${rarest.name} Operator`;
  if (loadout.hatItemId === "crown") return "Pond Sovereign";
  if (loadout.billItemId === "key") return "Security Key Goose";
  return "Verified Pond Operator";
}
