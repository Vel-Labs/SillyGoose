import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addAudit } from "@/lib/auth/store";
import { sendVerifiedPing } from "@/lib/growth-loop";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before sending a verified ping." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    const ping = await sendVerifiedPing(user, typeof body.message === "string" ? body.message : undefined);
    await addAudit(`${user.name} sent a verified in-app ping.`, "game");
    return NextResponse.json({ ok: true, ping });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verified ping failed." }, { status: 400 });
  }
}
