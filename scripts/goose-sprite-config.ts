export type GooseAssetCategory =
  | "base"
  | "hat"
  | "eyes"
  | "bill_item"
  | "held_item"
  | "neck"
  | "aura";

export type BaseVariant = "full" | "bust" | "wing-hold" | "bill";
export type CosmeticVariant = "standalone" | "bust-preview";

export type CellOverride = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  pad?: number;
  skip?: boolean;
};

export type SpriteSheetConfig = {
  file: string;
  category: GooseAssetCategory;
  outputFolder: string;
  layout: "base-kit" | "top-items-bottom-previews";
  columns: number;
  rows: number;
  topSectionRows?: number;
  bottomSectionRows?: number;
  slugs: string[];
  backgroundColor?: string;
  tolerance?: number;
  edgeFeather?: number;
  pad?: number;
  cellInset?: number;
  columnBounds?: Array<[number, number]>;
  rowBounds?: Array<[number, number]>;
  cells?: Record<string, CellOverride>;
};

export const baseSlugs = ["classic", "golden", "zombie", "holographic", "robotic"] as const;

export const hatSlugs = [
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
  "graduation-cap"
] as const;

export const eyeSlugs = [
  "sunglasses",
  "monocle",
  "three-d-glasses",
  "eyepatch",
  "laser-visor",
  "reading-glasses",
  "sleep-mask",
  "heart-glasses",
  "cyber-visor"
] as const;

export const billItemSlugs = [
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
  "glow-stick"
] as const;

export const heldItemSlugs = [
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
  "accordion"
] as const;

export const neckSlugs = [
  "poncho",
  "bow-tie",
  "spike-collar",
  "gold-chain",
  "medal",
  "scarf",
  "security-badge",
  "armor-plate",
  "feather-boa"
] as const;

export const auraSlugs = [
  "fire-aura",
  "hologram-shimmer",
  "lightning-crackle",
  "smoke",
  "crown-glow",
  "achievement-sparkle",
  "toxic-ooze",
  "heart-particles",
  "verified-security-glyph"
] as const;

export const requiredGooseSpriteSheets: SpriteSheetConfig[] = [
  {
    file: "base+pfp+weapon-arm+bill.png",
    category: "base",
    outputFolder: "bases",
    layout: "base-kit",
    columns: 4,
    rows: 5,
    slugs: [...baseSlugs],
    tolerance: 72,
    edgeFeather: 24,
    pad: 28,
    cellInset: 18,
    columnBounds: [
      [20, 309],
      [324, 590],
      [607, 865],
      [880, 1099]
    ],
    rowBounds: [
      [22, 309],
      [324, 596],
      [612, 865],
      [881, 1125],
      [1140, 1380]
    ]
  },
  {
    file: "hats+examples.png",
    category: "hat",
    outputFolder: "hats",
    layout: "top-items-bottom-previews",
    columns: 4,
    rows: 8,
    topSectionRows: 4,
    bottomSectionRows: 4,
    slugs: [...hatSlugs],
    tolerance: 78,
    edgeFeather: 24,
    pad: 24,
    columnBounds: [
      [0, 295],
      [296, 591],
      [592, 887]
    ],
    rowBounds: [
      [40, 245],
      [250, 470],
      [470, 690],
      [690, 890],
      [940, 1185],
      [1185, 1375],
      [1375, 1580],
      [1580, 1774]
    ]
  },
  {
    file: "eyes+examples.png",
    category: "eyes",
    outputFolder: "eyes",
    layout: "top-items-bottom-previews",
    columns: 3,
    rows: 6,
    topSectionRows: 3,
    bottomSectionRows: 3,
    slugs: [...eyeSlugs],
    tolerance: 78,
    edgeFeather: 24,
    pad: 24,
    columnBounds: [
      [0, 215],
      [225, 438],
      [448, 660],
      [670, 887]
    ],
    rowBounds: [
      [40, 280],
      [320, 500],
      [560, 750],
      [820, 1120],
      [1120, 1420],
      [1420, 1720]
    ],
    cells: {
      "sunglasses:standalone": { x: 18, y: 82, width: 292, height: 155 },
      "monocle:standalone": { x: 318, y: 82, width: 248, height: 205 },
      "three-d-glasses:standalone": { x: 604, y: 86, width: 256, height: 165 },
      "eyepatch:standalone": { x: 0, y: 312, width: 290, height: 190 },
      "laser-visor:standalone": { x: 318, y: 310, width: 268, height: 185 },
      "reading-glasses:standalone": { x: 604, y: 310, width: 270, height: 185 },
      "sleep-mask:standalone": { x: 0, y: 538, width: 300, height: 210 },
      "heart-glasses:standalone": { x: 318, y: 538, width: 270, height: 190 },
      "cyber-visor:standalone": { x: 606, y: 538, width: 270, height: 190 }
    }
  },
  {
    file: "bill_accessory+examples.png",
    category: "bill_item",
    outputFolder: "bill-items",
    layout: "top-items-bottom-previews",
    columns: 4,
    rows: 6,
    topSectionRows: 3,
    bottomSectionRows: 3,
    slugs: [...billItemSlugs],
    tolerance: 78,
    edgeFeather: 24,
    pad: 24,
    columnBounds: [
      [0, 215],
      [225, 438],
      [448, 660],
      [670, 887]
    ],
    rowBounds: [
      [50, 300],
      [320, 560],
      [590, 820],
      [940, 1185],
      [1185, 1435],
      [1435, 1715]
    ]
  },
  {
    file: "weapon+examples.png",
    category: "held_item",
    outputFolder: "held-items",
    layout: "top-items-bottom-previews",
    columns: 4,
    rows: 8,
    topSectionRows: 4,
    bottomSectionRows: 4,
    slugs: [...heldItemSlugs],
    tolerance: 78,
    edgeFeather: 24,
    pad: 24,
    rowBounds: [
      [40, 260],
      [260, 480],
      [480, 700],
      [700, 890],
      [900, 1125],
      [1125, 1350],
      [1350, 1565],
      [1565, 1774]
    ]
  },
  {
    file: "chest_examples.png",
    category: "neck",
    outputFolder: "neck",
    layout: "top-items-bottom-previews",
    columns: 3,
    rows: 6,
    topSectionRows: 3,
    bottomSectionRows: 3,
    slugs: [...neckSlugs],
    tolerance: 78,
    edgeFeather: 24,
    pad: 24,
    rowBounds: [
      [80, 300],
      [320, 560],
      [570, 810],
      [850, 1145],
      [1145, 1440],
      [1440, 1740]
    ]
  },
  {
    file: "aura+examples.png",
    category: "aura",
    outputFolder: "auras",
    layout: "top-items-bottom-previews",
    columns: 3,
    rows: 6,
    topSectionRows: 3,
    bottomSectionRows: 3,
    slugs: [...auraSlugs],
    tolerance: 82,
    edgeFeather: 28,
    pad: 28,
    rowBounds: [
      [40, 320],
      [340, 600],
      [620, 890],
      [910, 1195],
      [1195, 1490],
      [1490, 1760]
    ]
  }
];
