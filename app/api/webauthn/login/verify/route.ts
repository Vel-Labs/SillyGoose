import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { addAudit } from "@/lib/auth/store";
import { verifyAuthentication } from "@/lib/auth/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { handle, response } = await request.json();
    const user = await verifyAuthentication(request, String(handle || "captain-goose"), response, "login");
    await createSession(user.id);
    await addAudit(`${user.name} signed in with a fresh WebAuthn assertion.`, "auth");
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed." }, { status: 400 });
  }
}
