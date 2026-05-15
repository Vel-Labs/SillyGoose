import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { type BaseVariant, type CosmeticVariant, requiredGooseSpriteSheets } from "./goose-sprite-config";

type ManifestAsset = {
  slug: string;
  category: string;
  variant: BaseVariant | CosmeticVariant;
  path: string;
  sourceFile: string;
  width: number;
  height: number;
};

type AuditIssue = {
  severity: "error" | "warning";
  code: string;
  asset?: string;
  message: string;
  details?: Record<string, unknown>;
};

type AssetAudit = {
  path: string;
  slug: string;
  category: string;
  variant: string;
  width: number;
  height: number;
  hasAlpha: boolean;
  transparentCorners: number;
  visiblePixels: number;
  visibleBounds: null | { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  componentCount: number;
  largestComponentPixels: number;
  magentaRatio: number;
  issues: AuditIssue[];
};

const repoRoot = process.cwd();
const publicRoot = path.join(repoRoot, "public");
const assetRoot = path.join(publicRoot, "goose-assets");
const manifestPath = path.join(assetRoot, "manifests", "goose-assets.manifest.json");
const auditReportPath = path.join(assetRoot, "manifests", "asset-audit-report.json");
const alphaThreshold = 12;

function publicToFilePath(publicPath: string) {
  return path.join(publicRoot, publicPath.replace(/^\//, ""));
}

function expectedPublicPaths() {
  const expected: Array<{ path: string; category: string; slug: string; variant: string }> = [];
  for (const sheet of requiredGooseSpriteSheets) {
    if (sheet.layout === "base-kit") {
      for (const slug of sheet.slugs) {
        for (const variant of ["full", "bust", "wing-hold", "bill"] as BaseVariant[]) {
          expected.push({
            path: `/goose-assets/${sheet.outputFolder}/${slug}/${variant}.png`,
            category: sheet.category,
            slug,
            variant
          });
        }
      }
      continue;
    }
    for (const slug of sheet.slugs) {
      expected.push({
        path: `/goose-assets/${sheet.outputFolder}/${slug}.png`,
        category: sheet.category,
        slug,
        variant: "standalone"
      });
      expected.push({
        path: `/goose-assets/${sheet.outputFolder}/${slug}-bust-preview.png`,
        category: sheet.category,
        slug,
        variant: "bust-preview"
      });
    }
  }
  return expected;
}

function pushIssue(issues: AuditIssue[], issue: AuditIssue) {
  issues.push(issue);
}

function inspectComponents(mask: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(mask.length);
  let componentCount = 0;
  let largestComponentPixels = 0;
  const queue: number[] = [];

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || visited[start]) continue;
    componentCount++;
    let size = 0;
    visited[start] = 1;
    queue.length = 0;
    queue.push(start);

    while (queue.length > 0) {
      const current = queue.pop() as number;
      size++;
      const x = current % width;
      const y = Math.floor(current / width);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (!mask[next] || visited[next]) continue;
          visited[next] = 1;
          queue.push(next);
        }
      }
    }
    largestComponentPixels = Math.max(largestComponentPixels, size);
  }

  return { componentCount, largestComponentPixels };
}

async function auditAsset(asset: ManifestAsset) {
  const filePath = publicToFilePath(asset.path);
  const image = sharp(filePath).ensureAlpha();
  const metadata = await image.metadata();
  const raw = await image.raw().toBuffer();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const issues: AuditIssue[] = [];
  const mask = new Uint8Array(width * height);
  let visiblePixels = 0;
  let magentaLike = 0;
  let transparentCorners = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  const cornerOffsets = [
    3,
    (width - 1) * 4 + 3,
    ((height - 1) * width) * 4 + 3,
    (((height - 1) * width) + (width - 1)) * 4 + 3
  ];
  for (const offset of cornerOffsets) {
    if ((raw[offset] ?? 255) <= alphaThreshold) transparentCorners++;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rawOffset = (y * width + x) * 4;
      const alpha = raw[rawOffset + 3];
      if (alpha <= alphaThreshold) continue;
      const maskOffset = y * width + x;
      mask[maskOffset] = 1;
      visiblePixels++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      const r = raw[rawOffset];
      const g = raw[rawOffset + 1];
      const b = raw[rawOffset + 2];
      if (r > 170 && b > 170 && g < 90 && Math.abs(r - b) < 85) magentaLike++;
    }
  }

  const visibleBounds = visiblePixels
    ? { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 }
    : null;
  const { componentCount, largestComponentPixels } = inspectComponents(mask, width, height);
  const magentaRatio = visiblePixels ? magentaLike / visiblePixels : 0;
  const visibleRatio = width * height ? visiblePixels / (width * height) : 0;

  if (!metadata.hasAlpha) {
    pushIssue(issues, { severity: "error", code: "missing-alpha", asset: asset.path, message: "PNG does not report an alpha channel." });
  }
  if (transparentCorners < 4) {
    pushIssue(issues, { severity: "warning", code: "opaque-corner", asset: asset.path, message: "One or more output corners are not transparent.", details: { transparentCorners } });
  }
  if (width < 40 || height < 40 || visiblePixels < 100) {
    pushIssue(issues, { severity: "warning", code: "tiny-visible-area", asset: asset.path, message: "Visible crop area is suspiciously small.", details: { width, height, visiblePixels } });
  }
  if (visibleBounds && (visibleBounds.minX <= 1 || visibleBounds.minY <= 1 || visibleBounds.maxX >= width - 2 || visibleBounds.maxY >= height - 2)) {
    pushIssue(issues, { severity: "warning", code: "visible-touches-bounds", asset: asset.path, message: "Visible pixels touch the output bounds; crop may be too tight.", details: visibleBounds });
  }
  if (magentaRatio > 0.04) {
    pushIssue(issues, { severity: "warning", code: "magenta-remains", asset: asset.path, message: "Possible chroma-key background remains.", details: { magentaRatio } });
  }
  if (asset.category === "eyes" && asset.variant === "standalone") {
    if (!visibleBounds || visibleBounds.width < 36 || visibleBounds.height < 24 || visibleRatio < 0.025) {
      pushIssue(issues, { severity: "warning", code: "eye-visible-area-small", asset: asset.path, message: "Eye accessory visible area is smaller than expected.", details: { visibleBounds, visibleRatio } });
    }
    if (componentCount > 3 && largestComponentPixels / Math.max(visiblePixels, 1) < 0.74) {
      pushIssue(issues, {
        severity: "warning",
        code: "eye-fragmented-components",
        asset: asset.path,
        message: "Eye accessory has several disconnected visible components; inspect for neighbor fragments.",
        details: { componentCount, largestComponentPixels, visiblePixels }
      });
    }
  }

  return {
    path: asset.path,
    slug: asset.slug,
    category: asset.category,
    variant: asset.variant,
    width,
    height,
    hasAlpha: Boolean(metadata.hasAlpha),
    transparentCorners,
    visiblePixels,
    visibleBounds,
    componentCount,
    largestComponentPixels,
    magentaRatio,
    issues
  } satisfies AssetAudit;
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { assets: ManifestAsset[] };
  const manifestByPath = new Map(manifest.assets.map((asset) => [asset.path, asset]));
  const issues: AuditIssue[] = [];

  for (const expected of expectedPublicPaths()) {
    if (!manifestByPath.has(expected.path)) {
      pushIssue(issues, {
        severity: "error",
        code: "missing-manifest-entry",
        asset: expected.path,
        message: `Expected ${expected.category}/${expected.slug}/${expected.variant} is missing from the manifest.`
      });
      continue;
    }
    try {
      await access(publicToFilePath(expected.path));
    } catch {
      pushIssue(issues, {
        severity: "error",
        code: "missing-file",
        asset: expected.path,
        message: "Expected output file does not exist."
      });
    }
  }

  const audits = await Promise.all(manifest.assets.map(auditAsset));
  for (const audit of audits) issues.push(...audit.issues);

  const countsByCategory = audits.reduce<Record<string, number>>((counts, audit) => {
    counts[audit.category] = (counts[audit.category] ?? 0) + 1;
    return counts;
  }, {});
  const issuesByCode = issues.reduce<Record<string, number>>((counts, issue) => {
    counts[issue.code] = (counts[issue.code] ?? 0) + 1;
    return counts;
  }, {});
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.length - errorCount;

  await mkdir(path.dirname(auditReportPath), { recursive: true });
  await writeFile(
    auditReportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        manifestPath,
        assetCount: audits.length,
        countsByCategory,
        errorCount,
        warningCount,
        issuesByCode,
        issues,
        audits
      },
      null,
      2
    )}\n`
  );

  console.log(`Audited ${audits.length} goose assets.`);
  for (const [category, count] of Object.entries(countsByCategory)) console.log(`- ${category}: ${count}`);
  console.log(`Audit report: ${path.relative(repoRoot, auditReportPath)}`);
  console.log(`Issues: ${errorCount} errors, ${warningCount} warnings`);
  for (const issue of issues.slice(0, 20)) {
    console.warn(`- ${issue.severity} ${issue.code}${issue.asset ? ` ${issue.asset}` : ""}: ${issue.message}`);
  }
  if (issues.length > 20) console.warn(`- ${issues.length - 20} more issues in ${path.relative(repoRoot, auditReportPath)}`);
  if (errorCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
