import { NextResponse } from "next/server";
import { authenticationOptions } from "@/lib/auth/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { handle } = await request.json().catch(() => ({ handle: undefined }));
    const { options } = await authenticationOptions(request, handle ? String(handle) : undefined, "login");
    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start login." }, { status: 400 });
  }
}
