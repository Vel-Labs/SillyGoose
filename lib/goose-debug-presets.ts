import type { GooseLoadout } from "@/lib/goose-cosmetics";

export type GooseDebugPresetSlug = "clean" | "royal" | "cyber" | "zombie" | "chaos";

export type GooseDebugPreset = {
  slug: GooseDebugPresetSlug;
  label: string;
  patch: Partial<GooseLoadout>;
};

export const gooseDebugPresets: GooseDebugPreset[] = [
  {
    slug: "clean",
    label: "Clean",
    patch: {
      baseItemId: "classic",
      hatItemId: null,
      eyesItemId: null,
      billItemId: null,
      heldItemId: null,
      neckItemId: null,
      auraItemId: null,
      badgeItemId: "human-verified"
    }
  },
  {
    slug: "royal",
    label: "Royal",
    patch: {
      baseItemId: "classic",
      hatItemId: "crown",
      eyesItemId: null,
      billItemId: null,
      heldItemId: null,
      neckItemId: "gold-chain",
      auraItemId: null,
      badgeItemId: "human-verified"
    }
  },
  {
    slug: "cyber",
    label: "Cyber",
    patch: {
      baseItemId: "robotic",
      hatItemId: null,
      eyesItemId: "cyber-visor",
      billItemId: null,
      heldItemId: "controller",
      neckItemId: "security-badge",
      auraItemId: "verified-security-glyph",
      badgeItemId: "human-verified"
    }
  },
  {
    slug: "zombie",
    label: "Zombie",
    patch: {
      baseItemId: "zombie",
      hatItemId: null,
      eyesItemId: "eyepatch",
      billItemId: null,
      heldItemId: "bottle",
      neckItemId: null,
      auraItemId: "smoke",
      badgeItemId: "human-verified"
    }
  },
  {
    slug: "chaos",
    label: "Chaos Test",
    patch: {
      baseItemId: "holographic",
      hatItemId: "traffic-cone",
      eyesItemId: null,
      billItemId: "scroll",
      heldItemId: "mace",
      neckItemId: "poncho",
      auraItemId: "smoke",
      badgeItemId: "human-verified"
    }
  }
];
