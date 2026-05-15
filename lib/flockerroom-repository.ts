import {
  getDefaultLoadout,
  starterAchievementCatalog,
  starterCosmeticCatalog,
  type AchievementCatalogItem,
  type CosmeticCategory,
  type CosmeticItem,
  type CosmeticRarity,
  type CosmeticUnlockType,
  type GooseLoadout
} from "@/lib/goose-cosmetics";

export type FlockerroomSource = "supabase" | "fallback";

export type RepositoryResult<T> = {
  data: T;
  source: FlockerroomSource;
  message?: string;
};

export type UserCosmeticUnlock = {
  id?: string;
  userId: string;
  cosmeticItemId?: string;
  cosmeticSlug: string;
  source: "default" | "achievement" | "streak" | "purchase" | "admin_grant" | "event" | "migration";
  sourceRef?: string | null;
  unlockedAt: string;
};

export type FlockerroomState = {
  catalog: CosmeticItem[];
  loadouts: GooseLoadout[];
  unlocks: UserCosmeticUnlock[];
  source: FlockerroomSource;
  message?: string;
};

export type FlockerroomRepository = {
  getCosmeticCatalog(): Promise<RepositoryResult<CosmeticItem[]>>;
  getUserGooseLoadouts(userId: string): Promise<RepositoryResult<GooseLoadout[]>>;
  createDefaultGooseLoadouts(userId: string): Promise<RepositoryResult<GooseLoadout[]>>;
  saveGooseLoadout(userId: string, loadout: GooseLoadout): Promise<RepositoryResult<GooseLoadout>>;
  setActiveGooseLoadout(userId: string, loadoutId: string): Promise<RepositoryResult<GooseLoadout[]>>;
  getUserCosmeticUnlocks(userId: string): Promise<RepositoryResult<UserCosmeticUnlock[]>>;
};

type CosmeticItemRow = {
  id: string;
  slug: string;
  name: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  asset_path: string | null;
  preview_path: string | null;
  headshot_path: string | null;
  layer_order: number;
  tags: string[] | null;
  unlock_type: CosmeticUnlockType;
  unlock_rule_json: Record<string, unknown> | null;
  is_active: boolean;
  is_premium: boolean;
  sort_order: number;
};

type GooseLoadoutRow = {
  id: string;
  user_id: string;
  slot_index: number;
  name: string;
  title: string | null;
  honkline: string | null;
  base_item_id: string | null;
  hat_item_id: string | null;
  eyes_item_id: string | null;
  bill_item_id: string | null;
  held_item_id: string | null;
  neck_item_id: string | null;
  badge_item_id: string | null;
  ribbon_item_id: string | null;
  aura_item_id: string | null;
  frame_item_id: string | null;
  background_item_id: string | null;
  composite_asset_path: string | null;
  headshot_asset_path: string | null;
  is_active: boolean;
  is_preset: boolean;
  preset_slug: string | null;
};

type UserCosmeticUnlockRow = {
  id: string;
  user_id: string;
  cosmetic_item_id: string;
  source: UserCosmeticUnlock["source"];
  source_ref: string | null;
  unlocked_at: string;
  cosmetic_items?: {
    slug?: string;
  } | null;
};

type SupabaseConfig = {
  url: string;
  secretKey: string;
  schema: string;
};

const fallbackMessage = "Using local preview mode.";

export async function getFlockerroomState(userId: string): Promise<FlockerroomState> {
  const catalog = await getCosmeticCatalog();
  const loadouts = await getUserGooseLoadouts(userId);
  const unlocks = await getUserCosmeticUnlocks(userId);
  const source: FlockerroomSource = catalog.source === "supabase" && loadouts.source === "supabase" && unlocks.source === "supabase" ? "supabase" : "fallback";
  return {
    catalog: catalog.data,
    loadouts: loadouts.data,
    unlocks: unlocks.data,
    source,
    message: source === "supabase" ? "Synced to Flockerroom." : catalog.message ?? loadouts.message ?? unlocks.message ?? fallbackMessage
  };
}

export function getCosmeticCatalog() {
  return flockerroomRepository.getCosmeticCatalog();
}

export function getUserGooseLoadouts(userId: string) {
  return flockerroomRepository.getUserGooseLoadouts(userId);
}

export function createDefaultGooseLoadouts(userId: string) {
  return flockerroomRepository.createDefaultGooseLoadouts(userId);
}

export function saveGooseLoadout(userId: string, loadout: GooseLoadout) {
  return flockerroomRepository.saveGooseLoadout(userId, loadout);
}

export function setActiveGooseLoadout(userId: string, loadoutId: string) {
  return flockerroomRepository.setActiveGooseLoadout(userId, loadoutId);
}

export function getUserCosmeticUnlocks(userId: string) {
  return flockerroomRepository.getUserCosmeticUnlocks(userId);
}

export function getStarterCatalogSeed() {
  return {
    cosmetics: starterCosmeticCatalog,
    achievements: starterAchievementCatalog
  } satisfies {
    cosmetics: CosmeticItem[];
    achievements: AchievementCatalogItem[];
  };
}

export function isMissingFlockerroomTableError(error: unknown) {
  const text = errorToMessage(error).toLowerCase();
  return (
    text.includes("does not exist") ||
    text.includes("pgrst205") ||
    text.includes("pgrst202") ||
    text.includes("42p01") ||
    text.includes("cosmetic_items") ||
    text.includes("goose_loadouts") ||
    text.includes("user_cosmetic_unlocks")
  );
}

const flockerroomRepository: FlockerroomRepository = {
  async getCosmeticCatalog() {
    const client = getSupabaseRestClient();
    if (!client) return fallback(starterCosmeticCatalog);
    try {
      const rows = await client.select<CosmeticItemRow>("cosmetic_items", "is_active=eq.true&order=category.asc,sort_order.asc,name.asc");
      if (!rows.length) return fallback(starterCosmeticCatalog, "Flockerroom catalog is empty; using starter catalog.");
      return synced(rows.map(cosmeticFromRow));
    } catch (error) {
      return fallback(starterCosmeticCatalog, fallbackReason(error));
    }
  },

  async getUserGooseLoadouts(userId: string) {
    if (!userId) return fallback(makeDefaultLoadouts("local"), "Missing user id; using local preview slots.");
    const client = getSupabaseRestClient();
    if (!client) return fallback(makeDefaultLoadouts(userId));
    try {
      const [rows, catalogRows] = await Promise.all([
        client.select<GooseLoadoutRow>("goose_loadouts", `user_id=eq.${encodeURIComponent(userId)}&order=slot_index.asc`),
        client.select<CosmeticItemRow>("cosmetic_items", "is_active=eq.true")
      ]);
      if (!rows.length) return createDefaultGooseLoadouts(userId);
      return synced(rows.map((row) => loadoutFromRow(row, catalogRows)));
    } catch (error) {
      return fallback(makeDefaultLoadouts(userId), fallbackReason(error));
    }
  },

  async createDefaultGooseLoadouts(userId: string) {
    if (!userId) return fallback(makeDefaultLoadouts("local"), "Missing user id; using local preview slots.");
    const client = getSupabaseRestClient();
    if (!client) return fallback(makeDefaultLoadouts(userId));
    try {
      const existing = await client.select<GooseLoadoutRow>("goose_loadouts", `user_id=eq.${encodeURIComponent(userId)}&order=slot_index.asc`);
      const existingSlots = new Set(existing.map((row) => row.slot_index));
      const hasActiveLoadout = existing.some((row) => row.is_active);
      const missingDefaults = makeDefaultLoadouts(userId).filter((loadout) => !existingSlots.has(loadout.slotIndex));
      if (missingDefaults.length) {
        const catalogRows = await client.select<CosmeticItemRow>("cosmetic_items", "is_active=eq.true");
        const payload = missingDefaults.map((loadout) => loadoutToRow(userId, { ...loadout, isActive: hasActiveLoadout ? false : loadout.isActive }, catalogRows));
        await client.request<GooseLoadoutRow[]>("goose_loadouts", {
          method: "POST",
          query: "on_conflict=user_id,slot_index",
          body: payload,
          prefer: "resolution=merge-duplicates,return=representation"
        });
      }
      if (!hasActiveLoadout && existingSlots.has(1)) {
        await client.request<GooseLoadoutRow[]>("goose_loadouts", {
          method: "PATCH",
          query: `user_id=eq.${encodeURIComponent(userId)}&slot_index=eq.1`,
          body: { is_active: true },
          prefer: "return=minimal"
        });
      }
      return getUserGooseLoadouts(userId);
    } catch (error) {
      return fallback(makeDefaultLoadouts(userId), fallbackReason(error));
    }
  },

  async saveGooseLoadout(userId: string, loadout: GooseLoadout) {
    const normalized = normalizeOwnedLoadout(userId, loadout);
    if (!userId) return fallback(normalized, "Missing user id; preview saved locally.");
    const client = getSupabaseRestClient();
    if (!client) return fallback(normalized);
    try {
      const catalogRows = await client.select<CosmeticItemRow>("cosmetic_items", "is_active=eq.true");
      const payload = loadoutToRow(userId, normalized, catalogRows);
      const query = `user_id=eq.${encodeURIComponent(userId)}&slot_index=eq.${normalized.slotIndex}`;
      const rows = await client.request<GooseLoadoutRow[]>("goose_loadouts", {
        method: "PATCH",
        query,
        body: payload,
        prefer: "return=representation"
      });
      const saved = rows[0] ? loadoutFromRow(rows[0], catalogRows) : normalized;
      return synced(saved);
    } catch (error) {
      return fallback(normalized, fallbackReason(error, "Supabase unavailable, preview saved locally."));
    }
  },

  async setActiveGooseLoadout(userId: string, loadoutId: string) {
    if (!userId) return fallback(makeDefaultLoadouts("local"), "Missing user id; active preview saved locally.");
    const client = getSupabaseRestClient();
    if (!client) {
      return fallback(makeDefaultLoadouts(userId).map((loadout) => ({ ...loadout, isActive: loadout.id === loadoutId })));
    }
    try {
      const rpcRows = await client.rpc<GooseLoadoutRow>("set_active_goose_loadout", {
        p_user_id: userId,
        p_loadout_id: loadoutId
      });
      if (rpcRows.length) return getUserGooseLoadouts(userId);
    } catch (error) {
      if (!isRpcUnavailableError(error)) {
        return fallback(makeDefaultLoadouts(userId).map((loadout) => ({ ...loadout, isActive: loadout.id === loadoutId })), fallbackReason(error, "Supabase unavailable, active preview saved locally."));
      }
    }
    try {
      await client.request<GooseLoadoutRow[]>("goose_loadouts", {
        method: "PATCH",
        query: `user_id=eq.${encodeURIComponent(userId)}`,
        body: { is_active: false },
        prefer: "return=minimal"
      });
      await client.request<GooseLoadoutRow[]>("goose_loadouts", {
        method: "PATCH",
        query: `user_id=eq.${encodeURIComponent(userId)}&id=eq.${encodeURIComponent(loadoutId)}`,
        body: { is_active: true },
        prefer: "return=minimal"
      });
      return getUserGooseLoadouts(userId);
    } catch (error) {
      return fallback(makeDefaultLoadouts(userId).map((loadout) => ({ ...loadout, isActive: loadout.id === loadoutId })), fallbackReason(error, "Supabase unavailable, active preview saved locally."));
    }
  },

  async getUserCosmeticUnlocks(userId: string) {
    if (!userId) return fallback(defaultUnlocks("local"), "Missing user id; using default unlocks.");
    const client = getSupabaseRestClient();
    if (!client) return fallback(defaultUnlocks(userId));
    try {
      const rows = await client.select<UserCosmeticUnlockRow>(
        "user_cosmetic_unlocks",
        `user_id=eq.${encodeURIComponent(userId)}&select=id,user_id,cosmetic_item_id,source,source_ref,unlocked_at,cosmetic_items(slug)&order=unlocked_at.desc`
      );
      if (!rows.length) return fallback(defaultUnlocks(userId), "No Supabase unlocks found; using default unlocks only.");
      return synced(rows.map(unlockFromRow).filter((unlock) => Boolean(unlock.cosmeticSlug)));
    } catch (error) {
      return fallback(defaultUnlocks(userId), fallbackReason(error));
    }
  }
};

function getSupabaseRestClient() {
  if (typeof window !== "undefined") return null;
  if (process.env.DEMO_SUPABASE_ENABLED !== "true" && process.env.DEMO_STORE_ADAPTER !== "supabase") return null;
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const schema = process.env.SUPABASE_SCHEMA || "silly_goose_entertainment";
  if (!url || !secretKey || secretKey.includes("replace_me")) return null;
  return new SupabaseRestClient({ url, secretKey, schema });
}

class SupabaseRestClient {
  constructor(private readonly config: SupabaseConfig) {}

  select<T>(table: string, query = "") {
    return this.request<T[]>(table, { method: "GET", query });
  }

  rpc<T>(functionName: string, body: unknown) {
    return this.request<T[]>(`rpc/${functionName}`, {
      method: "POST",
      body,
      prefer: "return=representation"
    });
  }

  async request<T>(table: string, options: { method: "GET" | "POST" | "PATCH"; query?: string; body?: unknown; prefer?: string }) {
    const query = options.query ? `?${options.query}` : "";
    const response = await fetch(`${this.config.url}/rest/v1/${table}${query}`, {
      method: options.method,
      headers: {
        apikey: this.config.secretKey,
        Authorization: `Bearer ${this.config.secretKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": this.config.schema,
        "Content-Profile": this.config.schema,
        ...(options.prefer ? { Prefer: options.prefer } : {})
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store"
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text || `${options.method} ${table} failed with ${response.status}`);
    if (!text) return [] as T;
    return JSON.parse(text) as T;
  }
}

function cosmeticFromRow(row: CosmeticItemRow): CosmeticItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    rarity: row.rarity,
    assetPath: row.asset_path,
    previewPath: row.preview_path,
    headshotPath: row.headshot_path,
    layerOrder: row.layer_order,
    tags: row.tags ?? [],
    unlockType: row.unlock_type,
    unlockRuleJson: row.unlock_rule_json ?? {},
    isActive: row.is_active,
    isPremium: row.is_premium,
    sortOrder: row.sort_order
  };
}

function loadoutFromRow(row: GooseLoadoutRow, catalogRows: CosmeticItemRow[]): GooseLoadout {
  const slugById = new Map(catalogRows.map((item) => [item.id, item.slug]));
  return {
    id: row.id,
    userId: row.user_id,
    slotIndex: clampSlot(row.slot_index),
    name: row.name,
    title: row.title,
    honkline: row.honkline,
    baseItemId: slugById.get(row.base_item_id ?? "") ?? null,
    hatItemId: slugById.get(row.hat_item_id ?? "") ?? null,
    eyesItemId: slugById.get(row.eyes_item_id ?? "") ?? null,
    billItemId: slugById.get(row.bill_item_id ?? "") ?? null,
    heldItemId: slugById.get(row.held_item_id ?? "") ?? null,
    neckItemId: slugById.get(row.neck_item_id ?? "") ?? null,
    badgeItemId: slugById.get(row.badge_item_id ?? "") ?? null,
    ribbonItemId: slugById.get(row.ribbon_item_id ?? "") ?? null,
    auraItemId: slugById.get(row.aura_item_id ?? "") ?? null,
    frameItemId: slugById.get(row.frame_item_id ?? "") ?? null,
    backgroundItemId: slugById.get(row.background_item_id ?? "") ?? null,
    compositeAssetPath: row.composite_asset_path,
    headshotAssetPath: row.headshot_asset_path,
    isActive: row.is_active,
    isPreset: row.is_preset,
    presetSlug: row.preset_slug
  };
}

function loadoutToRow(userId: string, loadout: GooseLoadout, catalogRows: CosmeticItemRow[]) {
  const idBySlug = new Map(catalogRows.map((item) => [item.slug, item.id]));
  return {
    user_id: userId,
    slot_index: clampSlot(loadout.slotIndex),
    name: loadout.name || "Untitled Goose",
    title: loadout.title ?? null,
    honkline: loadout.honkline ?? null,
    base_item_id: idBySlug.get(loadout.baseItemId ?? "") ?? null,
    hat_item_id: idBySlug.get(loadout.hatItemId ?? "") ?? null,
    eyes_item_id: idBySlug.get(loadout.eyesItemId ?? "") ?? null,
    bill_item_id: idBySlug.get(loadout.billItemId ?? "") ?? null,
    held_item_id: idBySlug.get(loadout.heldItemId ?? "") ?? null,
    neck_item_id: idBySlug.get(loadout.neckItemId ?? "") ?? null,
    badge_item_id: idBySlug.get(loadout.badgeItemId ?? "") ?? null,
    ribbon_item_id: idBySlug.get(loadout.ribbonItemId ?? "") ?? null,
    aura_item_id: idBySlug.get(loadout.auraItemId ?? "") ?? null,
    frame_item_id: idBySlug.get(loadout.frameItemId ?? "") ?? null,
    background_item_id: idBySlug.get(loadout.backgroundItemId ?? "") ?? null,
    composite_asset_path: loadout.compositeAssetPath ?? null,
    headshot_asset_path: loadout.headshotAssetPath ?? null,
    is_active: loadout.isActive,
    is_preset: loadout.isPreset ?? false,
    preset_slug: loadout.presetSlug ?? null
  };
}

function unlockFromRow(row: UserCosmeticUnlockRow): UserCosmeticUnlock {
  return {
    id: row.id,
    userId: row.user_id,
    cosmeticItemId: row.cosmetic_item_id,
    cosmeticSlug: row.cosmetic_items?.slug ?? "",
    source: row.source,
    sourceRef: row.source_ref,
    unlockedAt: row.unlocked_at
  };
}

function makeDefaultLoadouts(userId: string) {
  return [1, 2, 3].map((slotIndex) => getDefaultLoadout(userId, slotIndex as 1 | 2 | 3));
}

function normalizeOwnedLoadout(userId: string, loadout: GooseLoadout) {
  return {
    ...loadout,
    userId,
    slotIndex: clampSlot(loadout.slotIndex)
  };
}

function clampSlot(slotIndex: number): 1 | 2 | 3 {
  if (slotIndex === 2 || slotIndex === 3) return slotIndex;
  return 1;
}

function defaultUnlocks(userId: string) {
  const now = new Date(0).toISOString();
  return starterCosmeticCatalog
    .filter((item) => item.unlockType === "default" || item.unlockType === "legacy")
    .map((item) => ({
      userId,
      cosmeticSlug: item.slug,
      source: item.unlockType === "legacy" ? "migration" : "default",
      sourceRef: item.unlockType,
      unlockedAt: now
    } satisfies UserCosmeticUnlock));
}

function synced<T>(data: T): RepositoryResult<T> {
  return { data, source: "supabase", message: "Synced to Flockerroom." };
}

function fallback<T>(data: T, message = fallbackMessage): RepositoryResult<T> {
  return { data, source: "fallback", message };
}

function fallbackReason(error: unknown, generic = fallbackMessage) {
  if (isMissingFlockerroomTableError(error)) return "Flockerroom tables are missing; using local preview mode.";
  return `${generic} ${errorToMessage(error)}`.trim();
}

function isRpcUnavailableError(error: unknown) {
  const text = errorToMessage(error).toLowerCase();
  return text.includes("set_active_goose_loadout") || text.includes("pgrst202") || text.includes("404") || text.includes("function");
}

function errorToMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error.";
  }
}
