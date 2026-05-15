import Image from "next/image";
import type { CosmeticItem, GooseLoadout } from "@/lib/goose-cosmetics";
import { resolveGooseLayers } from "@/lib/goose-layer-resolver";
import type { GoosePreviewMode, LayerPosition } from "@/lib/goose-layer-positions";

export type GooseLayeredPreviewProps = {
  mode: GoosePreviewMode;
  loadout: GooseLoadout;
  cosmeticsBySlug: Record<string, CosmeticItem>;
  className?: string;
  showDebugAnchors?: boolean;
  showBillOverlay?: boolean;
  showWingOverlay?: boolean;
  layerOverrides?: Record<string, Partial<LayerPosition>>;
  visibleLayerKeys?: Set<string> | string[];
  selectedLayerKey?: string | null;
  onLayerSelect?: (layerKey: string) => void;
};

function layerStyle(position: LayerPosition) {
  const scale = position.scale ?? 1;
  const rotate = position.rotate ?? 0;
  return {
    left: `${position.x}%`,
    top: `${position.y}%`,
    width: `${position.width ?? 100}%`,
    height: position.height ? `${position.height}%` : "auto",
    opacity: position.opacity ?? 1,
    zIndex: position.zIndex,
    transform: `scale(${scale}) rotate(${rotate}deg)`,
    transformOrigin: "center center"
  };
}

export function GooseLayeredPreview({
  mode,
  loadout,
  cosmeticsBySlug,
  className = "",
  showDebugAnchors = false,
  showBillOverlay,
  showWingOverlay,
  layerOverrides,
  visibleLayerKeys,
  selectedLayerKey,
  onLayerSelect
}: GooseLayeredPreviewProps) {
  const resolution = resolveGooseLayers(mode, loadout, cosmeticsBySlug, {
    showBillOverlay,
    showWingOverlay
  });
  const label = `${mode === "full" ? "Full-body" : "Bust"} layered goose preview`;
  const visibleLayerSet = Array.isArray(visibleLayerKeys) ? new Set(visibleLayerKeys) : visibleLayerKeys;
  const renderedLayers = resolution.layers
    .filter((layer) => !visibleLayerSet || visibleLayerSet.has(layer.key))
    .map((layer) => {
      const position = { ...layer.position, ...layerOverrides?.[layer.key] };
      return { ...layer, position, zIndex: position.zIndex ?? layer.zIndex };
    })
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className={`goose-layered-preview goose-layered-preview-${mode} ${className}`} aria-label={label}>
      <div className="goose-layered-stage">
        {renderedLayers.map((layer) => {
          const selected = selectedLayerKey === layer.key;
          return (
            <button
              key={layer.key}
              type="button"
              className={`goose-layer goose-layer-${layer.kind} ${onLayerSelect ? "goose-layer-interactive" : ""} ${showDebugAnchors ? "goose-layer-debug" : ""} ${selected ? "goose-layer-selected" : ""}`}
              style={layerStyle(layer.position)}
              title={showDebugAnchors ? `${layer.kind}: ${layer.slug}` : undefined}
              onClick={onLayerSelect ? () => onLayerSelect(layer.key) : undefined}
              aria-label={`${layer.kind} ${layer.slug}`}
              tabIndex={onLayerSelect ? 0 : -1}
            >
            <Image
              src={layer.src}
              alt=""
              fill
              priority={mode === "full"}
              sizes={mode === "full" ? "(max-width: 768px) 80vw, 340px" : "160px"}
              className="goose-layer-image"
              draggable={false}
            />
            </button>
          );
        })}
      </div>
      {showDebugAnchors ? (
        <div className="goose-layer-debug-panel">
          <strong>{mode} layers</strong>
          <span>base: {resolution.selectedSlugs.base}</span>
          {renderedLayers.map((layer) => (
            <span key={`debug-${layer.key}`}>
              {layer.kind}/{layer.anchorSlot}: {layer.slug} x:{layer.position.x} y:{layer.position.y} w:{layer.position.width ?? 100} o:{layer.position.opacity ?? 1} z:{layer.zIndex}
            </span>
          ))}
          {[...resolution.warnings, ...resolution.omitted].map((warning) => (
            <em key={warning}>{warning}</em>
          ))}
        </div>
      ) : null}
    </div>
  );
}
