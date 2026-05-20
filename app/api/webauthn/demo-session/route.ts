import { NextResponse } from "next/server";
import { defaultGooseHandle } from "@/lib/auth/goose-handle";
import { createSession } from "@/lib/auth/session";
import { addAudit, getOrCreateUser } from "@/lib/auth/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { handle } = await request.json().catch(() => ({ handle: defaultGooseHandle }));
  const user = await getOrCreateUser(String(handle || defaultGooseHandle));
  await createSession(user.id, request);
  await addAudit(`${user.name} entered marked demo fallback mode after WebAuthn was unavailable.`, "auth");
  return NextResponse.json({ ok: true, user, demoOnly: true });
}
