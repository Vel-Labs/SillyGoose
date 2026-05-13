import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { makeMove } from "@/lib/game/engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before making a verified move." }, { status: 401 });
  try {
    const { roomId, index } = await request.json();
    const room = await makeMove(String(roomId), user.id, Number(index));
    return NextResponse.json({ ok: true, room });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Move failed." }, { status: 400 });
  }
}
