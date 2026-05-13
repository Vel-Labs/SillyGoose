import { NextResponse } from "next/server";
import { defaultGooseHandle } from "@/lib/auth/goose-handle";
import { createSession } from "@/lib/auth/session";
import { addAudit } from "@/lib/auth/store";
import { verifyRegistration } from "@/lib/auth/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { handle, response } = await request.json();
    const user = await verifyRegistration(request, String(handle || defaultGooseHandle), response);
    await createSession(user.id);
    await addAudit(`${user.name} registered a Ledger Security Key-compatible WebAuthn credential.`, "auth");
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Registration failed." }, { status: 400 });
  }
}
