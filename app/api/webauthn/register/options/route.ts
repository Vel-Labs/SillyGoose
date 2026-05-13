import { NextResponse } from "next/server";
import { defaultGooseHandle } from "@/lib/auth/goose-handle";
import { registrationOptions } from "@/lib/auth/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { handle } = await request.json();
    return NextResponse.json(await registrationOptions(request, String(handle || defaultGooseHandle)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start registration." }, { status: 400 });
  }
}
