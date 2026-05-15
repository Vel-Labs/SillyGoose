"use client";

import { Clipboard, Eye, EyeOff, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Panel, SectionHeader, StatusBadge } from "@/components/arcade-primitives";
import { GooseLayeredPreview } from "@/components/goose-layered-preview";
import { Button } from "@/components/ui/button";
import { getDefaultLoadout, starterCosmeticCatalog, type GooseLoadout } from "@/lib/goose-cosmetics";
import { gooseDebugPresets, type GooseDebugPresetSlug } from "@/lib/goose-debug-presets";
import { resolveGooseLayers, type ResolvedGooseLayer } from "@/lib/goose-layer-resolver";
import type { GoosePreviewMode, LayerPosition } from "@/lib/goose-layer-positions";

type AssetAuditIssue = {
  severity: "error" | "warning";
  code: string;
  asset?: string;
  message: string;
  details?: Record<string, unknown>;
};

type GooseLayerCalibratorProps = {
  auditIssues: AssetAuditIssue[];
};

type CalibrationExport = {
  mode: GoosePreviewMode;
  preset: GooseDebugPresetSlug;
  base: string | null | undefined;
  overrides: Record<string, Partial<LayerPosition> & { visible?: boolean; slug?: string; kind?: string; anchorSlot?: string }>;
};

const calibratorUserId = "calibrator";
const cosmeticsBySlug = Object.fromEntries(starterCosmeticCatalog.map((item) => [item.slug, item]));

function makePresetLoadout(presetSlug: GooseDebugPresetSlug): GooseLoadout {
  const preset = gooseDebugPresets.find((candidate) => candidate.slug === presetSlug) ?? gooseDebugPresets[0];
  return {
    ...getDefaultLoadout(calibratorUserId, 1),
    id: `calibrator-${preset.slug}`,
    name: preset.label,
    title: `${preset.label} Calibration`,
    honkline: "Layer calibration only.",
    ...preset.patch
  };
}

function positionValue(layer: ResolvedGooseLayer | undefined, overrides: Record<string, Partial<LayerPosition>>) {
  if (!layer) return null;
  return { ...layer.position, ...overrides[layer.key] };
}

function roundPosition(position: Partial<LayerPosition>) {
  const rounded: Partial<LayerPosition> = {};
  for (const key of ["x", "y", "width", "height", "scale", "rotate", "opacity", "zIndex"] as const) {
    const value = position[key];
    if (typeof value === "number" && Number.isFinite(value)) rounded[key] = Math.round(value * 100) / 100;
  }
  return rounded;
}

function layerConfigKey(layer: ResolvedGooseLayer) {
  if (layer.kind === "holding_wing" || layer.kind === "bill_mask" || layer.kind === "base_body") return layer.kind;
  return `${layer.kind}:${layer.slug}`;
}

export function GooseLayerCalibrator({ auditIssues }: GooseLayerCalibratorProps) {
  const [mode, setMode] = useState<GoosePreviewMode>("full");
  const [presetSlug, setPresetSlug] = useState<GooseDebugPresetSlug>("royal");
  const [selectedLayerKey, setSelectedLayerKey] = useState<string | null>(null);
  const [layerOverrides, setLayerOverrides] = useState<Record<string, Partial<LayerPosition>>>({});
  const [hiddenLayerKeys, setHiddenLayerKeys] = useState<Set<string>>(() => new Set());
  const [copyStatus, setCopyStatus] = useState("");
  const [importText, setImportText] = useState("");

  const loadout = useMemo(() => makePresetLoadout(presetSlug), [presetSlug]);
  const resolution = useMemo(() => resolveGooseLayers(mode, loadout, cosmeticsBySlug), [loadout, mode]);
  const visibleLayerKeys = useMemo(() => resolution.layers.map((layer) => layer.key).filter((key) => !hiddenLayerKeys.has(key)), [hiddenLayerKeys, resolution.layers]);
  const selectedLayer = resolution.layers.find((layer) => layer.key === selectedLayerKey) ?? resolution.layers[0];
  const selectedPosition = positionValue(selectedLayer, layerOverrides);
  const warningsByAsset = useMemo(() => {
    const grouped = new Map<string, AssetAuditIssue[]>();
    for (const issue of auditIssues) {
      if (!issue.asset) continue;
      grouped.set(issue.asset, [...(grouped.get(issue.asset) ?? []), issue]);
    }
    return grouped;
  }, [auditIssues]);
  const selectedWarnings = selectedLayer ? warningsByAsset.get(selectedLayer.src) ?? [] : [];

  useEffect(() => {
    if (!resolution.layers.length) {
      setSelectedLayerKey(null);
      return;
    }
    setSelectedLayerKey((current) => (current && resolution.layers.some((layer) => layer.key === current) ? current : resolution.layers[0].key));
    setHiddenLayerKeys((current) => new Set([...current].filter((key) => resolution.layers.some((layer) => layer.key === key))));
  }, [resolution.layers]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!selectedLayer || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const step = event.shiftKey ? 5 : 1;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudgeSelected(-step, 0);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nudgeSelected(step, 0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        nudgeSelected(0, -step);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        nudgeSelected(0, step);
      } else if (event.key === "[") {
        event.preventDefault();
        adjustSelected("zIndex", -1);
      } else if (event.key === "]") {
        event.preventDefault();
        adjustSelected("zIndex", 1);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        adjustSelected("width", 1);
      } else if (event.key === "-") {
        event.preventDefault();
        adjustSelected("width", -1);
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetSelectedLayer();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function resetCalibration(nextPreset: GooseDebugPresetSlug = presetSlug, nextMode: GoosePreviewMode = mode) {
    setPresetSlug(nextPreset);
    setMode(nextMode);
    setLayerOverrides({});
    setHiddenLayerKeys(new Set());
    setCopyStatus("");
  }

  function setSelectedPositionValue(key: keyof LayerPosition, value: number | undefined) {
    if (!selectedLayer) return;
    setLayerOverrides((current) => ({
      ...current,
      [selectedLayer.key]: {
        ...current[selectedLayer.key],
        [key]: value
      }
    }));
  }

  function adjustSelected(key: keyof LayerPosition, delta: number) {
    if (!selectedLayer || !selectedPosition) return;
    const current = typeof selectedPosition[key] === "number" ? selectedPosition[key] : key === "opacity" ? 1 : key === "zIndex" ? selectedLayer.zIndex : 0;
    setSelectedPositionValue(key, Math.round((current + delta) * 100) / 100);
  }

  function nudgeSelected(deltaX: number, deltaY: number) {
    if (!selectedLayer || !selectedPosition) return;
    setLayerOverrides((current) => ({
      ...current,
      [selectedLayer.key]: {
        ...current[selectedLayer.key],
        x: Math.round(((selectedPosition.x ?? 0) + deltaX) * 100) / 100,
        y: Math.round(((selectedPosition.y ?? 0) + deltaY) * 100) / 100
      }
    }));
  }

  function resetSelectedLayer() {
    if (!selectedLayer) return;
    setLayerOverrides((current) => {
      const next = { ...current };
      delete next[selectedLayer.key];
      return next;
    });
  }

  function toggleLayerVisibility(layerKey: string) {
    setHiddenLayerKeys((current) => {
      const next = new Set(current);
      if (next.has(layerKey)) next.delete(layerKey);
      else next.add(layerKey);
      return next;
    });
  }

  function buildExport(): CalibrationExport {
    const overrides: CalibrationExport["overrides"] = {};
    for (const layer of resolution.layers) {
      const override = layerOverrides[layer.key];
      const hidden = hiddenLayerKeys.has(layer.key);
      if (!override && !hidden) continue;
      overrides[layerConfigKey(layer)] = {
        ...roundPosition(override ?? {}),
        visible: !hidden,
        slug: layer.slug,
        kind: layer.kind,
        anchorSlot: layer.anchorSlot
      };
    }
    return {
      mode,
      preset: presetSlug,
      base: loadout.baseItemId,
      overrides
    };
  }

  const jsonExport = JSON.stringify(buildExport(), null, 2);
  const tsExport = `export const CALIBRATED_LAYER_OVERRIDES = ${jsonExport} as const;\n`;

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus(`Could not copy ${label}. Select the export text manually.`);
    }
  }

  function applyImport() {
    try {
      const parsed = JSON.parse(importText) as CalibrationExport;
      const importMode = parsed.mode === "full" || parsed.mode === "bust" ? parsed.mode : mode;
      const importPreset = gooseDebugPresets.some((preset) => preset.slug === parsed.preset) ? parsed.preset : presetSlug;
      const importLoadout = makePresetLoadout(importPreset);
      const importResolution = resolveGooseLayers(importMode, importLoadout, cosmeticsBySlug);
      setLayerOverrides({});
      setHiddenLayerKeys(new Set());
      setMode(importMode);
      setPresetSlug(importPreset);
      const nextOverrides: Record<string, Partial<LayerPosition>> = {};
      const hidden = new Set<string>();
      for (const layer of importResolution.layers) {
        const imported = parsed.overrides[layerConfigKey(layer)] ?? parsed.overrides[layer.key];
        if (!imported) continue;
        const { visible, slug: _slug, kind: _kind, anchorSlot: _anchorSlot, ...position } = imported;
        nextOverrides[layer.key] = position;
        if (visible === false) hidden.add(layer.key);
      }
      setLayerOverrides(nextOverrides);
      setHiddenLayerKeys(hidden);
      setSelectedLayerKey(importResolution.layers[0]?.key ?? null);
      setCopyStatus("Imported calibration JSON.");
    } catch {
      setCopyStatus("Import failed. Paste exported calibration JSON.");
    }
  }

  return (
    <section className="app-width mx-auto w-full px-4 pb-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="brush-strip mb-2 inline-block px-3 py-1 text-[11px] text-parchment">Dev Tool</p>
          <h1 className="brush-title text-3xl leading-none text-white">Goose Layer Calibrator</h1>
          <p className="mt-2 max-w-3xl text-xs font-black uppercase leading-snug text-parchment/70">Tune temporary layer positions by sight, then export config values. Nothing here mutates Supabase or writes source files.</p>
        </div>
        <StatusBadge tone="soon">Debug Only</StatusBadge>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(360px,520px)_minmax(260px,340px)_minmax(320px,420px)]">
        <Panel className="poster-border grid content-start gap-3 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-2">
              {(["full", "bust"] as GoosePreviewMode[]).map((candidate) => (
                <button key={candidate} type="button" onClick={() => resetCalibration(presetSlug, candidate)} className={`goose-debug-toggle ${mode === candidate ? "" : "opacity-70"}`} aria-pressed={mode === candidate}>
                  {candidate}
                </button>
              ))}
            </div>
            <button type="button" className="goose-debug-toggle" onClick={() => resetCalibration()} aria-pressed="false">
              <RotateCcw className="mr-1 inline h-3 w-3" />
              Reset All
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {gooseDebugPresets.map((preset) => (
              <button key={preset.slug} type="button" onClick={() => resetCalibration(preset.slug)} className="goose-debug-preset" aria-pressed={presetSlug === preset.slug}>
                {preset.label}
              </button>
            ))}
          </div>

          <GooseLayeredPreview
            mode={mode}
            loadout={loadout}
            cosmeticsBySlug={cosmeticsBySlug}
            className={mode === "full" ? "min-h-[420px]" : "min-h-[360px]"}
            showDebugAnchors
            showBillOverlay
            showWingOverlay
            layerOverrides={layerOverrides}
            visibleLayerKeys={visibleLayerKeys}
            selectedLayerKey={selectedLayer?.key}
            onLayerSelect={setSelectedLayerKey}
          />
        </Panel>

        <Panel className="poster-border grid max-h-[calc(100dvh-130px)] content-start gap-2 overflow-y-auto p-3">
          <SectionHeader>Layer List</SectionHeader>
          {resolution.layers.map((layer) => {
            const hidden = hiddenLayerKeys.has(layer.key);
            const warnings = warningsByAsset.get(layer.src) ?? [];
            return (
              <button
                key={layer.key}
                type="button"
                onClick={() => setSelectedLayerKey(layer.key)}
                className={`selected-operator-panel text-left ${selectedLayer?.key === layer.key ? "preferred-goose-locked" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-black uppercase leading-snug text-ink">
                    {layer.kind}
                    <br />
                    <span className="text-ink/55">{layer.anchorSlot} / {layer.slug}</span>
                  </span>
                  <span className="text-[10px] font-black uppercase text-ember">z:{layerOverrides[layer.key]?.zIndex ?? layer.zIndex}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase text-ink/60">
                  <label className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" checked={!hidden} onChange={() => toggleLayerVisibility(layer.key)} />
                    {hidden ? "hidden" : "visible"}
                  </label>
                  {warnings.length ? <span>{warnings.length} warning</span> : <span>clean asset</span>}
                </div>
              </button>
            );
          })}
        </Panel>

        <Panel className="poster-border grid max-h-[calc(100dvh-130px)] content-start gap-3 overflow-y-auto p-3">
          <SectionHeader>Controls</SectionHeader>
          {selectedLayer && selectedPosition ? (
            <>
              <div className="rounded-sm border-2 border-black bg-parchment p-3 text-xs font-black uppercase leading-snug text-ink">
                <div>{selectedLayer.kind}</div>
                <div className="text-ink/55">{selectedLayer.anchorSlot} / {selectedLayer.slug}</div>
                <div className="mt-1 break-all text-[10px] text-ink/50">{selectedLayer.src}</div>
              </div>

              {selectedWarnings.length ? (
                <div className="grid gap-1 rounded-sm border-2 border-ember bg-ember/10 p-2 text-[10px] font-black uppercase leading-snug text-parchment">
                  {selectedWarnings.map((warning) => (
                    <div key={`${warning.code}-${warning.asset}`}>{warning.code}: {warning.message}</div>
                  ))}
                </div>
              ) : (
                <div className="rounded-sm border-2 border-black bg-black/30 p-2 text-[10px] font-black uppercase text-parchment/70">No asset audit warnings for this layer.</div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <NumberControl label="x" value={selectedPosition.x} onChange={(value) => setSelectedPositionValue("x", value)} />
                <NumberControl label="y" value={selectedPosition.y} onChange={(value) => setSelectedPositionValue("y", value)} />
                <NumberControl label="width" value={selectedPosition.width} onChange={(value) => setSelectedPositionValue("width", value)} />
                <NumberControl label="height" value={selectedPosition.height} onChange={(value) => setSelectedPositionValue("height", value)} allowBlank />
                <NumberControl label="rotate" value={selectedPosition.rotate ?? 0} onChange={(value) => setSelectedPositionValue("rotate", value)} />
                <NumberControl label="opacity" value={selectedPosition.opacity ?? 1} min={0} max={1} step={0.05} onChange={(value) => setSelectedPositionValue("opacity", value)} />
                <NumberControl label="zIndex" value={selectedPosition.zIndex ?? selectedLayer.zIndex} step={1} onChange={(value) => setSelectedPositionValue("zIndex", value)} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="goose-debug-toggle" onClick={() => nudgeSelected(0, -1)}>up</button>
                <button type="button" className="goose-debug-toggle" onClick={() => nudgeSelected(-1, 0)}>left</button>
                <button type="button" className="goose-debug-toggle" onClick={() => nudgeSelected(1, 0)}>right</button>
                <button type="button" className="goose-debug-toggle" onClick={() => nudgeSelected(0, 1)}>down</button>
                <button type="button" className="goose-debug-toggle" onClick={() => nudgeSelected(0, -5)}>up 5</button>
                <button type="button" className="goose-debug-toggle" onClick={() => nudgeSelected(0, 5)}>down 5</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="goose-debug-toggle" onClick={() => toggleLayerVisibility(selectedLayer.key)} aria-pressed={!hiddenLayerKeys.has(selectedLayer.key)}>
                  {hiddenLayerKeys.has(selectedLayer.key) ? <EyeOff className="mr-1 inline h-3 w-3" /> : <Eye className="mr-1 inline h-3 w-3" />}
                  visible
                </button>
                <button type="button" className="goose-debug-toggle" onClick={resetSelectedLayer} aria-pressed="false">
                  reset layer
                </button>
              </div>
            </>
          ) : null}

          <SectionHeader>Export</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={() => copyText(jsonExport, "JSON")} className="min-h-9 text-xs">
              <Clipboard className="h-4 w-4" />
              Copy JSON
            </Button>
            <Button type="button" variant="secondary" onClick={() => copyText(tsExport, "TS config")} className="min-h-9 text-xs">
              <Clipboard className="h-4 w-4" />
              Copy TS
            </Button>
          </div>
          {copyStatus ? <p className="rounded-sm bg-gooseblue px-3 py-2 text-xs font-black uppercase leading-snug text-white">{copyStatus}</p> : null}
          <textarea readOnly value={jsonExport} className="min-h-[180px] resize-y rounded-sm border-2 border-black bg-parchment p-2 font-mono text-[10px] leading-snug text-ink outline-none" />

          <SectionHeader>Import</SectionHeader>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste exported calibration JSON" className="min-h-[100px] resize-y rounded-sm border-2 border-black bg-parchment p-2 font-mono text-[10px] leading-snug text-ink outline-none" />
          <button type="button" className="goose-debug-toggle" onClick={applyImport}>Apply Imported JSON</button>
        </Panel>
      </div>
    </section>
  );
}

function NumberControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.5,
  allowBlank = false
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  allowBlank?: boolean;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase text-parchment/70">
      {label}
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          if (event.target.value === "" && allowBlank) onChange(undefined);
          else onChange(Number(event.target.value));
        }}
        className="rounded-sm border-2 border-black bg-parchment px-2 py-1.5 text-sm font-black text-ink outline-none"
      />
    </label>
  );
}
