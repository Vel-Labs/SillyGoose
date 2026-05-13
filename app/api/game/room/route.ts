import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addAudit, readStore } from "@/lib/auth/store";
import { createRoom, joinRoom } from "@/lib/game/engine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const roomId = new URL(request.url).searchParams.get("roomId");
  const store = await readStore();
  const room = roomId ? store.rooms.find((candidate) => candidate.id === roomId) : store.rooms[0];
  return NextResponse.json({ room: room ?? null });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before opening a verified room." }, { status: 401 });
  const { roomId, join, aiMode, goose } = await request.json().catch(() => ({}));
  try {
    const room = join ? await joinRoom(String(roomId), user.id) : await createRoom(user.id, Boolean(aiMode), String(goose || "captain"));
    await addAudit(join ? `${user.name} joined ${room.id} as a verified Player Two.` : `${user.name} opened ${room.id}.`, "game");
    return NextResponse.json({ ok: true, room });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update room." }, { status: 400 });
  }
}
