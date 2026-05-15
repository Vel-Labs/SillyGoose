import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  type BaseVariant,
  type CellOverride,
  type CosmeticVariant,
  type GooseAssetCategory,
  type SpriteSheetConfig,
  requiredGooseSpriteSheets
} from "./goose-sprite-config";

type Rgba = { r: number; g: number; b: number; a: number };
type Crop = { x: number; y: number; width: number; height: number };

type ManifestAsset = {
  slug: string;
  category: GooseAssetCategory;
  variant: BaseVariant | CosmeticVariant;
  path: string;
  sourceFile: string;
  width: number;
  height: number;
};

type ProcessingWarning = {
  asset?: string;
  sourceFile?: string;
  code: string;
  message: string;
};

const repoRoot = process.cwd();
const sourceDir = path.resolve(repoRoot, "..", "reference-art", "goose_sprites");
const outputRoot = path.resolve(repoRoot, "public", "goose-assets");
const manifestDir = path.join(outputRoot, "manifests");
const transparentPixel = { r: 0, g: 0, b: 0, alpha: 0 };
const baseVariants: BaseVariant[] = ["full", "bust", "wing-hold", "bill"];
const warnings: ProcessingWarning[] = [];
const skippedCells: Array<{ sourceFile: string; slug: string; variant: string; reason: string }> = [];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid backgroundColor ${hex}`);
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function colorDistance(pixel: Rgba, bg: Pick<Rgba, "r" | "g" | "b">) {
  return Math.sqrt((pixel.r - bg.r) ** 2 + (pixel.g - bg.g) ** 2 + (pixel.b - bg.b) ** 2);
}

function cellKey(slug: string, variant: string) {
  return `${slug}:${variant}`;
}

function applyOverride(crop: Crop, override: CellOverride | undefined, width: number, height: number): Crop | null {
  if (override?.skip) return null;
  const x = Math.round(override?.x ?? crop.x);
  const y = Math.round(override?.y ?? crop.y);
  const cropWidth = Math.round(override?.width ?? crop.width);
  const cropHeight = Math.round(override?.height ?? crop.height);
  return {
    x: clamp(x, 0, width - 1),
    y: clamp(y, 0, height - 1),
    width: clamp(cropWidth, 1, width - x),
    height: clamp(cropHeight, 1, height - y)
  };
}

function sectionCrop(
  imageWidth: number,
  imageHeight: number,
  sheet: Pick<SpriteSheetConfig, "columns" | "rows" | "columnBounds" | "rowBounds">,
  startRow: number,
  index: number,
  inset = 0
): Crop {
  const col = index % sheet.columns;
  const row = startRow + Math.floor(index / sheet.columns);
  const columnBounds = sheet.columnBounds?.[col] ?? [(imageWidth / sheet.columns) * col, (imageWidth / sheet.columns) * (col + 1)];
  const rowBounds = sheet.rowBounds?.[row] ?? [(imageHeight / sheet.rows) * row, (imageHeight / sheet.rows) * (row + 1)];
  const x = Math.round(columnBounds[0] + inset);
  const y = Math.round(rowBounds[0] + inset);
  return {
    x,
    y,
    width: Math.round(columnBounds[1] - columnBounds[0] - inset * 2),
    height: Math.round(rowBounds[1] - rowBounds[0] - inset * 2)
  };
}

async function removeBackgroundAndTrim(
  input: Buffer,
  options: { backgroundColor?: string; tolerance: number; edgeFeather: number; pad: number }
) {
  const image = sharp(input).ensureAlpha();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read cropped image dimensions");
  }
  const raw = await image.raw().toBuffer();
  const sampled = options.backgroundColor
    ? hexToRgb(options.backgroundColor)
    : { r: raw[0], g: raw[1], b: raw[2] };
  const featherEnd = options.tolerance + options.edgeFeather;

  for (let i = 0; i < raw.length; i += 4) {
    const pixel = { r: raw[i], g: raw[i + 1], b: raw[i + 2], a: raw[i + 3] };
    const distance = colorDistance(pixel, sampled);
    if (distance <= options.tolerance) {
      raw[i + 3] = 0;
    } else if (options.edgeFeather > 0 && distance < featherEnd) {
      const featherAlpha = Math.round(((distance - options.tolerance) / options.edgeFeather) * raw[i + 3]);
      raw[i + 3] = clamp(featherAlpha, 0, raw[i + 3]);
    }
  }

  const keyed = sharp(raw, {
    raw: {
      width: metadata.width,
      height: metadata.height,
      channels: 4
    }
  });

  const trimmedBuffer = await keyed
    .trim({ background: transparentPixel, threshold: 1 })
    .extend({
      top: options.pad,
      right: options.pad,
      bottom: options.pad,
      left: options.pad,
      background: transparentPixel
    })
    .png()
    .toBuffer();

  return sharp(trimmedBuffer).ensureAlpha().png().toBuffer();
}

async function analyzeOutput(buffer: Buffer, assetPath: string, sourceFile: string) {
  const image = sharp(buffer).ensureAlpha();
  const metadata = await image.metadata();
  const stats = await image.stats();
  const raw = await image.raw().toBuffer();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  let nonTransparent = 0;
  let edgeOpaque = 0;
  let magentaLike = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const alpha = raw[offset + 3];
      if (alpha <= 5) continue;
      nonTransparent++;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) edgeOpaque++;
      const r = raw[offset];
      const g = raw[offset + 1];
      const b = raw[offset + 2];
      if (r > 170 && b > 170 && g < 90 && Math.abs(r - b) < 85) magentaLike++;
    }
  }

  if (stats.channels.length < 4) {
    warnings.push({ asset: assetPath, sourceFile, code: "missing-alpha", message: "PNG was emitted without an alpha channel." });
  }
  if (width < 40 || height < 40 || nonTransparent < 100) {
    warnings.push({ asset: assetPath, sourceFile, code: "tiny-crop", message: `Output looks unusually small (${width}x${height}).` });
  }
  if (edgeOpaque > 0) {
    warnings.push({ asset: assetPath, sourceFile, code: "touches-bounds", message: "Opaque pixels touch output bounds after trimming." });
  }
  if (nonTransparent > 0 && magentaLike / nonTransparent > 0.04) {
    warnings.push({ asset: assetPath, sourceFile, code: "magenta-remains", message: "Possible chroma-key background remains in the output." });
  }

  return { width, height, nonTransparent, edgeOpaque, magentaLike };
}

async function emitAsset(params: {
  sourceFile: string;
  sourcePath: string;
  crop: Crop;
  slug: string;
  category: GooseAssetCategory;
  variant: BaseVariant | CosmeticVariant;
  outputFolder: string;
  outputFile: string;
  tolerance: number;
  edgeFeather: number;
  pad: number;
  backgroundColor?: string;
}) {
  const cropped = await sharp(params.sourcePath)
    .extract({
      left: params.crop.x,
      top: params.crop.y,
      width: params.crop.width,
      height: params.crop.height
    })
    .png()
    .toBuffer();
  const processed = await removeBackgroundAndTrim(cropped, {
    backgroundColor: params.backgroundColor,
    tolerance: params.tolerance,
    edgeFeather: params.edgeFeather,
    pad: params.pad
  });
  const outputDir = path.join(outputRoot, params.outputFolder, params.slug);
  const finalDir = params.category === "base" ? outputDir : path.join(outputRoot, params.outputFolder);
  await mkdir(finalDir, { recursive: true });
  const filePath = path.join(finalDir, params.outputFile);
  await sharp(processed).png().toFile(filePath);
  const relativePublicPath = path.relative(path.join(repoRoot, "public"), filePath).split(path.sep).join("/");
  const publicPath = `/${relativePublicPath}`;
  const analysis = await analyzeOutput(processed, publicPath, params.sourceFile);
  return {
    slug: params.slug,
    category: params.category,
    variant: params.variant,
    path: publicPath,
    sourceFile: params.sourceFile,
    width: analysis.width,
    height: analysis.height
  } satisfies ManifestAsset;
}

async function renderPreviewSheet(category: string, assets: ManifestAsset[]) {
  if (assets.length === 0) return;
  const thumbs = await Promise.all(
    assets.map(async (asset) => {
      const filePath = path.join(repoRoot, "public", asset.path.replace(/^\//, ""));
      const buffer = await sharp(filePath)
        .resize({ width: 160, height: 160, fit: "contain", background: transparentPixel })
        .extend({ top: 28, bottom: 8, left: 8, right: 8, background: { r: 245, g: 245, b: 238, alpha: 1 } })
        .png()
        .toBuffer();
      return { input: buffer, asset };
    })
  );
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(thumbs.length))));
  const tileWidth = 176;
  const tileHeight = 196;
  const rows = Math.ceil(thumbs.length / columns);
  const composites = thumbs.map((thumb, index) => ({
    input: thumb.input,
    left: (index % columns) * tileWidth,
    top: Math.floor(index / columns) * tileHeight
  }));
  await sharp({
    create: {
      width: columns * tileWidth,
      height: rows * tileHeight,
      channels: 4,
      background: { r: 35, g: 35, b: 35, alpha: 1 }
    }
  })
    .composite(composites)
    .png()
    .toFile(path.join(manifestDir, `preview-${category}.png`));
}

async function main() {
  const discoveredFiles = (await readdir(sourceDir)).filter((file) => file.toLowerCase().endsWith(".png")).sort();
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(manifestDir, { recursive: true });

  const manifestAssets: ManifestAsset[] = [];
  const processedFiles: Array<{ file: string; width: number; height: number; assets: number }> = [];

  for (const sheet of requiredGooseSpriteSheets) {
    if (!discoveredFiles.includes(sheet.file)) {
      warnings.push({ sourceFile: sheet.file, code: "missing-source-sheet", message: "Configured sprite sheet was not found." });
      continue;
    }
    const sourcePath = path.join(sourceDir, sheet.file);
    const metadata = await sharp(sourcePath).metadata();
    if (!metadata.width || !metadata.height) throw new Error(`Unable to inspect ${sheet.file}`);
    const emittedBefore = manifestAssets.length;

    if (sheet.layout === "base-kit") {
      for (const [row, slug] of sheet.slugs.entries()) {
        for (const [column, variant] of baseVariants.entries()) {
          const crop = sectionCrop(metadata.width, metadata.height, sheet, 0, row * sheet.columns + column, sheet.cellInset ?? 0);
          const override = sheet.cells?.[cellKey(slug, variant)];
          const resolvedCrop = applyOverride(crop, override, metadata.width, metadata.height);
          if (!resolvedCrop) {
            skippedCells.push({ sourceFile: sheet.file, slug, variant, reason: "manual-skip" });
            continue;
          }
          manifestAssets.push(
            await emitAsset({
              sourceFile: sheet.file,
              sourcePath,
              crop: resolvedCrop,
              slug,
              category: sheet.category,
              variant,
              outputFolder: sheet.outputFolder,
              outputFile: `${variant}.png`,
              tolerance: sheet.tolerance ?? 72,
              edgeFeather: sheet.edgeFeather ?? 24,
              pad: override?.pad ?? sheet.pad ?? 24,
              backgroundColor: sheet.backgroundColor
            })
          );
        }
      }
    } else {
      const topRows = sheet.topSectionRows ?? Math.floor(sheet.rows / 2);
      const bottomRows = sheet.bottomSectionRows ?? sheet.rows - topRows;
      const topCapacity = topRows * sheet.columns;
      const bottomStartRow = topRows;
      for (const [index, slug] of sheet.slugs.entries()) {
        if (index >= topCapacity || index >= bottomRows * sheet.columns) {
          skippedCells.push({ sourceFile: sheet.file, slug, variant: "all", reason: "outside-configured-grid" });
          continue;
        }
        const standaloneCrop = sectionCrop(metadata.width, metadata.height, sheet, 0, index, sheet.cellInset ?? 0);
        const previewCrop = sectionCrop(metadata.width, metadata.height, sheet, bottomStartRow, index, sheet.cellInset ?? 0);

        for (const variant of ["standalone", "bust-preview"] as CosmeticVariant[]) {
          const crop = variant === "standalone" ? standaloneCrop : previewCrop;
          const override = sheet.cells?.[cellKey(slug, variant)];
          const resolvedCrop = applyOverride(crop, override, metadata.width, metadata.height);
          if (!resolvedCrop) {
            skippedCells.push({ sourceFile: sheet.file, slug, variant, reason: "manual-skip" });
            continue;
          }
          manifestAssets.push(
            await emitAsset({
              sourceFile: sheet.file,
              sourcePath,
              crop: resolvedCrop,
              slug,
              category: sheet.category,
              variant,
              outputFolder: sheet.outputFolder,
              outputFile: variant === "standalone" ? `${slug}.png` : `${slug}-bust-preview.png`,
              tolerance: sheet.tolerance ?? 78,
              edgeFeather: sheet.edgeFeather ?? 24,
              pad: override?.pad ?? sheet.pad ?? 24,
              backgroundColor: sheet.backgroundColor
            })
          );
        }
      }
    }

    processedFiles.push({
      file: sheet.file,
      width: metadata.width,
      height: metadata.height,
      assets: manifestAssets.length - emittedBefore
    });
  }

  const expectedAssetCount = requiredGooseSpriteSheets.reduce((total, sheet) => {
    if (sheet.layout === "base-kit") return total + sheet.slugs.length * baseVariants.length;
    return total + sheet.slugs.length * 2;
  }, 0);

  const missingAssets = expectedAssetCount - manifestAssets.length;
  if (missingAssets > 0) {
    warnings.push({ code: "missing-required-assets", message: `${missingAssets} configured assets were not emitted.` });
  }

  const byCategory = manifestAssets.reduce<Record<string, number>>((counts, asset) => {
    counts[asset.category] = (counts[asset.category] ?? 0) + 1;
    return counts;
  }, {});

  await writeFile(
    path.join(manifestDir, "goose-assets.manifest.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceDir,
        assets: manifestAssets
      },
      null,
      2
    )}\n`
  );

  await writeFile(
    path.join(manifestDir, "processing-report.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceDir,
        outputRoot,
        discoveredFiles,
        filesProcessed: processedFiles,
        expectedAssetCount,
        assetsEmitted: manifestAssets.length,
        assetsByCategory: byCategory,
        skippedCells,
        warnings
      },
      null,
      2
    )}\n`
  );

  await Promise.all(
    Object.entries(
      manifestAssets.reduce<Record<string, ManifestAsset[]>>((groups, asset) => {
        const key = asset.category === "base" ? "bases" : asset.category.replace("_item", "-items");
        groups[key] = groups[key] ?? [];
        groups[key].push(asset);
        return groups;
      }, {})
    ).map(([category, assets]) => renderPreviewSheet(category, assets))
  );

  console.log(`Discovered ${discoveredFiles.length} sprite sheets:`);
  for (const file of discoveredFiles) console.log(`- ${file}`);
  console.log(`Emitted ${manifestAssets.length}/${expectedAssetCount} assets to ${path.relative(repoRoot, outputRoot)}`);
  for (const [category, count] of Object.entries(byCategory)) console.log(`- ${category}: ${count}`);
  console.log(`Manifest: ${path.relative(repoRoot, path.join(manifestDir, "goose-assets.manifest.json"))}`);
  console.log(`Processing report: ${path.relative(repoRoot, path.join(manifestDir, "processing-report.json"))}`);

  if (warnings.length > 0) {
    console.warn(`Warnings: ${warnings.length}`);
    for (const warning of warnings.slice(0, 20)) {
      console.warn(`- ${warning.code}${warning.asset ? ` ${warning.asset}` : ""}: ${warning.message}`);
    }
    if (warnings.length > 20) console.warn(`- ${warnings.length - 20} more warnings in processing-report.json`);
  }

  if (missingAssets > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
