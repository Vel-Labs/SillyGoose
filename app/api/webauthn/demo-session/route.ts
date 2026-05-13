import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { addAudit, getOrCreateUser } from "@/lib/auth/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { handle } = await request.json().catch(() => ({ handle: "captain-goose" }));
  const user = await getOrCreateUser(String(handle || "captain-goose"));
  await createSession(user.id);
  await addAudit(`${user.name} entered marked demo fallback mode after WebAuthn was unavailable.`, "auth");
  return NextResponse.json({ ok: true, user, demoOnly: true });
}
