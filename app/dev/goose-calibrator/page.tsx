import { readFile } from "node:fs/promises";
import path from "node:path";
import { Panel } from "@/components/arcade-primitives";
import { PageShell } from "@/components/brand-shell";
import { GooseLayerCalibrator } from "@/components/goose-layer-calibrator";

type AssetAuditIssue = {
  severity: "error" | "warning";
  code: string;
  asset?: string;
  message: string;
  details?: Record<string, unknown>;
};

async function readAuditIssues() {
  try {
    const reportPath = path.join(process.cwd(), "public", "goose-assets", "manifests", "asset-audit-report.json");
    const report = JSON.parse(await readFile(reportPath, "utf8")) as { issues?: AssetAuditIssue[] };
    return report.issues ?? [];
  } catch {
    return [
      {
        severity: "warning",
        code: "missing-audit-report",
        message: "Asset audit report could not be loaded. Run npm run assets:audit-goose-sprites."
      } satisfies AssetAuditIssue
    ];
  }
}

export default async function GooseCalibratorPage() {
  const debugEnabled = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG_GOOSE_LAYERS === "true";

  if (!debugEnabled) {
    return (
      <PageShell>
        <section className="app-width mx-auto w-full px-4 pb-4 sm:px-6">
          <Panel className="poster-border p-4">
            <p className="brush-strip mb-2 inline-block px-3 py-1 text-[11px] text-parchment">Dev Tool</p>
            <h1 className="brush-title text-3xl text-white">Goose calibrator is disabled.</h1>
            <p className="mt-2 max-w-2xl text-xs font-black uppercase leading-snug text-parchment/70">Set NEXT_PUBLIC_DEBUG_GOOSE_LAYERS=true in a non-user-facing environment to access layer calibration.</p>
          </Panel>
        </section>
      </PageShell>
    );
  }

  const auditIssues = await readAuditIssues();

  return (
    <PageShell>
      <GooseLayerCalibrator auditIssues={auditIssues} />
    </PageShell>
  );
}
