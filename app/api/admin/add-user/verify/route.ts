import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addAudit } from "@/lib/auth/store";
import { verifyAuthentication } from "@/lib/auth/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before adding an intern goose." }, { status: 401 });
  try {
    const { response, demoFallback } = await request.json();
    if (demoFallback) {
      const entry = await addAudit(`Intern Goose added by ${user.name} using visibly marked demo fallback approval.`, "admin");
      return NextResponse.json({ ok: true, entry, demoOnly: true });
    }
    await verifyAuthentication(request, user.handle, response, "admin");
    const entry = await addAudit(`Intern Goose added by ${user.name} after Security Key approval.`, "admin");
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin approval failed." }, { status: 400 });
  }
}
