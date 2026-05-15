"use client";

import { CheckCircle2, CircleDot, LockKeyhole, Save, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel, SectionHeader, StatusBadge } from "@/components/arcade-primitives";
import { GooseLayeredPreview } from "@/components/goose-layered-preview";
import { Button } from "@/components/ui/button";
import type { DemoUser } from "@/lib/auth/store";
import {
  canEquipCosmetic,
  deriveLoadoutTitleFromTraits,
  getDefaultLoadout,
  getHonklineFallback,
  getLoadoutLayers,
  groupCosmeticsByCategory,
  starterCosmeticCatalog,
  type CosmeticCategory,
  type CosmeticItem,
  type GooseLoadout
} from "@/lib/goose-cosmetics";
import type { FlockerroomState, UserCosmeticUnlock } from "@/lib/flockerroom-repository";
import { gooseDebugPresets } from "@/lib/goose-debug-presets";
import { resolveCosmeticThumbnail } from "@/lib/goose-layer-resolver";

type FlockerroomConsoleProps = {
  user: DemoUser;
};

const categoryTabs: Array<{ key: CosmeticCategory; label: string }> = [
  { key: "base", label: "Base" },
  { key: "hat", label: "Hats" },
  { key: "eyes", label: "Eyes" },
  { key: "bill_item", label: "Bill" },
  { key: "held_item", label: "Held" },
  { key: "neck", label: "Neck" },
  { key: "badge", label: "Badges" },
  { key: "ribbon", label: "Ribbons" },
  { key: "aura", label: "Auras" }
];

const categoryField: Partial<Record<CosmeticCategory, keyof GooseLoadout>> = {
  base: "baseItemId",
  hat: "hatItemId",
  eyes: "eyesItemId",
  bill_item: "billItemId",
  held_item: "heldItemId",
  neck: "neckItemId",
  badge: "badgeItemId",
  ribbon: "ribbonItemId",
  aura: "auraItemId",
  frame: "frameItemId",
  background: "backgroundItemId"
};

type BillOverlayMode = "auto" | "force" | "hide";

export function FlockerroomConsole({ user }: FlockerroomConsoleProps) {
  const storageKey = `silly-goose.flockerroom.${user.id}`;
  const previousRoomName = "flock" + "room";
  const legacyStorageKey = `silly-goose.${previousRoomName}.${user.id}`;
  const [loadouts, setLoadouts] = useState<GooseLoadout[]>(() => [1, 2, 3].map((slot) => getDefaultLoadout(user.id, slot as 1 | 2 | 3)));
  const [catalog, setCatalog] = useState<CosmeticItem[]>(starterCosmeticCatalog);
  const [unlocks, setUnlocks] = useState<UserCosmeticUnlock[]>(() => getDefaultUnlocks(user.id));
  const [selectedSlot, setSelectedSlot] = useState<1 | 2 | 3>(1);
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>("base");
  const [status, setStatus] = useState("Loading Flockerroom...");
  const [syncSource, setSyncSource] = useState<"supabase" | "fallback">("fallback");
  const [showLayerDebug, setShowLayerDebug] = useState(false);
  const [billOverlayMode, setBillOverlayMode] = useState<BillOverlayMode>("auto");
  const [showWingOverlay, setShowWingOverlay] = useState(true);
  const grouped = useMemo(() => groupCosmeticsByCategory(catalog), [catalog]);
  const cosmeticsBySlug = useMemo(() => Object.fromEntries(catalog.map((item) => [item.slug, item])), [catalog]);
  const unlockedSlugs = useMemo(() => new Set(unlocks.map((unlock) => unlock.cosmeticSlug)), [unlocks]);
  const selectedLoadout = loadouts.find((loadout) => loadout.slotIndex === selectedSlot) ?? loadouts[0];
  const selectedLayers = getLoadoutLayers(selectedLoadout, catalog);
  const selectedTitle = deriveLoadoutTitleFromTraits(selectedLoadout, catalog);
  const honkline = getHonklineFallback(selectedLoadout);
  const resolvedBillOverlay = billOverlayMode === "auto" ? undefined : billOverlayMode === "force";

  const applyRepositoryState = useCallback((state: FlockerroomState) => {
    setCatalog(state.catalog);
    setUnlocks(state.unlocks);
    setSyncSource(state.source);
    if (state.source === "supabase") {
      setLoadouts(normalizeSlots(user.id, state.loadouts));
    } else {
      setLoadouts((current) => normalizeSlots(user.id, current.length ? current : state.loadouts));
    }
    setStatus(state.message ?? (state.source === "supabase" ? "Synced to Flockerroom." : "Using local preview mode."));
  }, [user.id]);

  useEffect(() => {
    let cancelled = false;
    try {
      const saved = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as GooseLoadout[];
        if (Array.isArray(parsed) && parsed.length) {
          setLoadouts(normalizeSlots(user.id, parsed));
        }
      }
    } catch {
      setStatus("Saved Flockerroom preview could not be loaded. Starter slots are showing.");
    }
    fetch("/api/flockerroom", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Flockerroom API unavailable.");
        return response.json() as Promise<FlockerroomState>;
      })
      .then((state) => {
        if (cancelled) return;
        applyRepositoryState(state);
      })
      .catch(() => {
        if (!cancelled) setStatus("Using local preview mode.");
      });
    return () => {
      cancelled = true;
    };
  }, [applyRepositoryState, legacyStorageKey, storageKey, user.id]);

  function updateSelected(patch: Partial<GooseLoadout>) {
    setLoadouts((current) => current.map((loadout) => (loadout.slotIndex === selectedSlot ? { ...loadout, ...patch } : loadout)));
    setStatus("");
  }

  function equipCosmetic(item: CosmeticItem) {
    if (!canEquipCosmetic(item, unlockedSlugs)) {
      setStatus(`${item.name} is locked until ${item.unlockType.replace("_", " ")} unlocks are wired.`);
      return;
    }
    const field = categoryField[item.category];
    if (!field) return;
    updateSelected({ [field]: item.slug });
  }

  function clearCategory(category: CosmeticCategory) {
    const field = categoryField[category];
    if (!field || category === "base") return;
    updateSelected({ [field]: null });
  }

  function applyDebugPreset(preset: Partial<GooseLoadout>) {
    updateSelected(preset);
    setStatus("Debug preset applied locally.");
  }

  function cycleBillOverlayMode() {
    setBillOverlayMode((value) => {
      if (value === "auto") return "force";
      if (value === "force") return "hide";
      return "auto";
    });
  }

  async function saveFlock() {
    const loadout = loadouts.find((candidate) => candidate.slotIndex === selectedSlot);
    if (!loadout) return;
    window.localStorage.setItem(storageKey, JSON.stringify(loadouts));
    setStatus("Saving goose...");
    try {
      const response = await postJson("/api/flockerroom/loadout", { loadout });
      if (response.state) applyRepositoryState(response.state);
      setStatus(response.source === "supabase" ? "Synced to Flockerroom." : response.message ?? "Supabase unavailable, preview saved locally.");
    } catch {
      setStatus("Supabase unavailable, preview saved locally.");
    }
  }

  async function setActiveGoose() {
    const nextLoadouts = loadouts.map((loadout) => ({ ...loadout, isActive: loadout.slotIndex === selectedSlot }));
    setLoadouts(nextLoadouts);
    window.localStorage.setItem(storageKey, JSON.stringify(nextLoadouts));
    const active = nextLoadouts.find((loadout) => loadout.slotIndex === selectedSlot);
    if (!active) return;
    setStatus("Setting active goose...");
    try {
      const response = await postJson("/api/flockerroom/loadout", { loadoutId: active.id }, "POST");
      if (response.state) applyRepositoryState(response.state);
      setStatus(response.source === "supabase" ? "Active goose synced to Flockerroom." : response.message ?? "Active goose saved locally.");
    } catch {
      setStatus("Supabase unavailable, active goose saved locally.");
    }
  }

  return (
    <section className="app-width mx-auto w-full px-4 pb-2 sm:px-6">
      <div className="poster-border dashboard-frame grid gap-3 p-3 xl:grid-cols-[260px_1fr]">
        <aside className="dark-card grid content-start gap-3 p-3">
          <div>
            <p className="brush-strip mb-2 inline-block px-3 py-1 text-[11px] text-parchment">Flockerroom</p>
            <h1 className="brush-title text-3xl leading-none text-white">Suit up your Personal Flock.</h1>
            <p className="mt-2 text-xs font-black uppercase leading-snug text-parchment/70">Save up to three geese, equip questionable cosmetics, and send one active goose into verified pond combat.</p>
            <p className="mt-2 text-xs font-black uppercase leading-snug text-signal">@{user.handle} / preview loadouts</p>
          </div>

          <SectionHeader>Saved Goose Slots</SectionHeader>
          <div className="grid gap-2">
            {loadouts.map((loadout) => (
              <button
                key={loadout.slotIndex}
                type="button"
                onClick={() => setSelectedSlot(loadout.slotIndex)}
                className={`dashboard-tab-button ${selectedSlot === loadout.slotIndex ? "dashboard-tab-button-active" : ""}`}
                aria-pressed={selectedSlot === loadout.slotIndex}
              >
                {loadout.isActive ? <CheckCircle2 className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
                <span>
                  <strong>Slot {loadout.slotIndex}</strong>
                  <small>{loadout.name === "Untitled Goose" ? "This goose slot is waiting for poor decisions." : loadout.name}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-sm border-2 border-black bg-black/30 p-3 text-[11px] font-black uppercase leading-snug text-parchment/70">
            {syncSource === "supabase" ? "Synced to Flockerroom storage. The old active goose remains the gameplay/profile source." : "Using local preview mode. The old active goose remains the gameplay/profile source."}
          </div>
        </aside>

        <div className="grid gap-3 xl:grid-cols-[minmax(280px,380px)_1fr]">
          <Panel className="poster-border grid content-start gap-3 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionHeader>Selected Goose</SectionHeader>
                <h2 className="brush-title mt-3 text-3xl leading-none text-white">{selectedLoadout.name}</h2>
                <p className="mt-1 text-xs font-black uppercase text-signal">{selectedTitle}</p>
              </div>
              {selectedLoadout.isActive ? <StatusBadge tone="verified">Active</StatusBadge> : <StatusBadge tone="soon">Preview</StatusBadge>}
            </div>

            <div className="relative rounded-sm border-2 border-black bg-white/75 p-3">
              <p className="mb-2 text-[10px] font-black uppercase leading-none text-ink/60">Full Goose</p>
              <GooseLayeredPreview
                mode="full"
                loadout={selectedLoadout}
                cosmeticsBySlug={cosmeticsBySlug}
                className="min-h-[300px]"
                showDebugAnchors={showLayerDebug}
                showBillOverlay={resolvedBillOverlay}
                showWingOverlay={showWingOverlay}
              />

              <div className="mt-3 grid gap-3 md:grid-cols-[132px_1fr]">
                <div className="rounded-sm border-2 border-black bg-parchment p-2">
                  <p className="mb-1 text-[10px] font-black uppercase leading-none text-ink/60">Profile Bust</p>
                  <GooseLayeredPreview
                    mode="bust"
                    loadout={selectedLoadout}
                    cosmeticsBySlug={cosmeticsBySlug}
                    className="min-h-[128px]"
                    showDebugAnchors={showLayerDebug}
                    showBillOverlay={resolvedBillOverlay}
                    showWingOverlay={showWingOverlay}
                  />
                </div>
                <div className="grid content-start gap-1.5">
                  <p className="text-[10px] font-black uppercase leading-none text-ink/60">Layer Stack</p>
                  {selectedLayers.map((layer) => (
                    <div key={`${layer.category}-${layer.slug}`} className="goose-stat-row">
                      <span>{layer.category.replace("_", " ")}</span>
                      <strong>{layer.name}</strong>
                    </div>
                  ))}
                </div>
              </div>
              {process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG_GOOSE_LAYERS === "true" ? (
                <div className="mt-2 grid gap-2">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={() => setShowLayerDebug((value) => !value)} className="goose-debug-toggle">
                      {showLayerDebug ? "Hide layers" : "Debug layers"}
                    </button>
                    <button type="button" onClick={cycleBillOverlayMode} className="goose-debug-toggle" aria-pressed={billOverlayMode === "force"}>
                      {billOverlayMode === "auto" ? "Bill mask auto" : billOverlayMode === "force" ? "Bill mask forced" : "Bill mask off"}
                    </button>
                    <button type="button" onClick={() => setShowWingOverlay((value) => !value)} className="goose-debug-toggle" aria-pressed={showWingOverlay}>
                      {showWingOverlay ? "Wing overlay on" : "Wing overlay off"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {gooseDebugPresets.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => applyDebugPreset(preset.patch)} className="goose-debug-preset">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <label className="grid gap-1 text-[11px] font-black uppercase text-parchment/70">
              Title
              <input
                value={selectedLoadout.title ?? ""}
                onChange={(event) => updateSelected({ title: event.target.value })}
                placeholder={selectedTitle}
                className="rounded-sm border-2 border-black bg-parchment px-3 py-2 text-sm font-black uppercase text-ink outline-none"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-black uppercase text-parchment/70">
              Honkline
              <textarea
                value={selectedLoadout.honkline ?? ""}
                onChange={(event) => updateSelected({ honkline: event.target.value })}
                placeholder={honkline}
                rows={3}
                className="resize-none rounded-sm border-2 border-black bg-parchment px-3 py-2 text-sm font-black text-ink outline-none"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" onClick={saveFlock} className="min-h-10 px-3 py-2 text-xs">
                <Save className="h-4 w-4" />
                Save Goose
              </Button>
              <Button type="button" variant="secondary" onClick={setActiveGoose} className="min-h-10 px-3 py-2 text-xs">
                <ShieldCheck className="h-4 w-4" />
                Set Active Goose
              </Button>
            </div>
            {status ? <p className="rounded-sm bg-gooseblue px-3 py-2 text-xs font-black uppercase leading-snug text-white">{status}</p> : null}
          </Panel>

          <Panel className="poster-border grid min-h-0 content-start p-3 xl:max-h-[calc(100dvh-120px)] xl:overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionHeader>Cosmetic Catalog</SectionHeader>
                <p className="mt-3 text-xs font-black uppercase leading-snug text-parchment/65">Cards show standalone transparent assets. Bust-preview files stay out of the composed goose.</p>
              </div>
              <Sparkles className="h-6 w-6 text-signal" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={`goose-token min-h-12 min-w-[86px] ${activeCategory === tab.key ? "goose-token-active" : ""}`}
                  aria-pressed={activeCategory === tab.key}
                >
                  <span className="goose-token-name">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid max-h-[min(54vh,620px)] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {activeCategory !== "base" ? (
                <button type="button" onClick={() => clearCategory(activeCategory)} className="selected-operator-panel text-left">
                  <div className="text-xs font-black uppercase text-ink">None</div>
                  <div className="mt-1 text-[11px] font-black uppercase text-ink/60">Clear this layer</div>
                </button>
              ) : null}
              {grouped[activeCategory].map((item) => {
                const equipped = selectedLayers.some((layer) => layer.slug === item.slug);
                const unlocked = canEquipCosmetic(item, unlockedSlugs);
                const thumbnail = resolveCosmeticThumbnail(item);
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => equipCosmetic(item)}
                    className={`selected-operator-panel text-left ${equipped ? "preferred-goose-locked" : ""}`}
                    aria-pressed={equipped}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {thumbnail ? (
                        <div className="cosmetic-card-thumb" aria-hidden="true">
                          <Image src={thumbnail} alt="" fill sizes="72px" className="object-contain" />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <div className="text-sm font-black uppercase leading-none text-ink">{item.name}</div>
                        <div className="mt-1 text-[11px] font-black uppercase text-ember">{item.rarity}</div>
                      </div>
                      {unlocked ? <CheckCircle2 className="h-4 w-4 text-gooseblue" /> : <LockKeyhole className="h-4 w-4 text-ember" />}
                    </div>
                    <div className="mt-2 text-[11px] font-black uppercase leading-snug text-ink/60">{unlocked ? item.tags.join(" / ") : `${item.unlockType.replace("_", " ")} required`}</div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

async function postJson(path: string, body: unknown, method: "PATCH" | "POST" = "PATCH") {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data as {
    source?: "supabase" | "fallback";
    message?: string;
    state?: FlockerroomState;
  };
}

function normalizeSlots(userId: string, loadouts: GooseLoadout[]) {
  return [1, 2, 3].map((slot) => {
    const loadout = loadouts.find((candidate) => candidate.slotIndex === slot);
    return loadout ? { ...loadout, userId, slotIndex: slot as 1 | 2 | 3 } : getDefaultLoadout(userId, slot as 1 | 2 | 3);
  });
}

function getDefaultUnlocks(userId: string): UserCosmeticUnlock[] {
  return starterCosmeticCatalog
    .filter((item) => item.unlockType === "default" || item.unlockType === "legacy")
    .map((item) => ({
      userId,
      cosmeticSlug: item.slug,
      source: item.unlockType === "legacy" ? "migration" : "default",
      sourceRef: item.unlockType,
      unlockedAt: new Date(0).toISOString()
    }));
}
