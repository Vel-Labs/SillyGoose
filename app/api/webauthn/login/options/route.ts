import { NextResponse } from "next/server";
import { defaultGooseHandle } from "@/lib/auth/goose-handle";
import { authenticationOptions } from "@/lib/auth/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { handle } = await request.json();
    const { options } = await authenticationOptions(request, String(handle || defaultGooseHandle), "login");
    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start login." }, { status: 400 });
  }
}
