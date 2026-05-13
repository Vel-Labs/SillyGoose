import { NextResponse } from "next/server";
import { registrationOptions } from "@/lib/auth/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { handle } = await request.json();
    return NextResponse.json(await registrationOptions(request, String(handle || "captain-goose")));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start registration." }, { status: 400 });
  }
}
