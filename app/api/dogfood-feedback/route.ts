import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addAudit, newId, updateStore } from "@/lib/auth/store";

export const runtime = "nodejs";

const workflows = ["wallet-proof", "signed-rivalry", "bread-ledger", "verified-ping", "achievements", "overall-dogfood"] as const;
const severities = ["note", "blocked", "bug", "polish"] as const;
const serviceModes = ["local", "supabase", "vercel"] as const;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before recording dogfood feedback." }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  const workflow = workflows.includes(body.workflow) ? body.workflow : "overall-dogfood";
  const severity = severities.includes(body.severity) ? body.severity : "note";
  const serviceMode = serviceModes.includes(body.serviceMode) ? body.serviceMode : "local";
  const expected = String(body.expected ?? "").trim();
  const actual = String(body.actual ?? "").trim();
  const route = String(body.route ?? "/profile").trim() || "/profile";
  const viewport = String(body.viewport ?? "unknown").trim() || "unknown";

  if (expected.length < 8 || actual.length < 8) {
    return NextResponse.json({ error: "Dogfood feedback needs expected and actual notes with enough detail to act on." }, { status: 400 });
  }

  const feedback = await updateStore((store) => {
    const entry = {
      id: newId("feedback"),
      userId: user.id,
      route,
      workflow,
      expected,
      actual,
      severity,
      serviceMode,
      viewport,
      createdAt: new Date().toISOString()
    };
    store.dogfoodFeedback.unshift(entry);
    return entry;
  });
  await addAudit(`${user.name} recorded dogfood feedback for ${workflow}.`, "game");
  return NextResponse.json({ ok: true, feedback });
}
