import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authenticationOptions } from "@/lib/auth/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before adding an intern goose." }, { status: 401 });
  try {
    const { options } = await authenticationOptions(request, user.handle, "admin");
    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start admin approval." }, { status: 400 });
  }
}
