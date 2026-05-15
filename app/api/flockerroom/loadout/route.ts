import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getFlockerroomState, saveGooseLoadout, setActiveGooseLoadout } from "@/lib/flockerroom-repository";
import type { GooseLoadout } from "@/lib/goose-cosmetics";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const loadout = body.loadout as GooseLoadout | undefined;
  if (!loadout) return NextResponse.json({ error: "Missing loadout." }, { status: 400 });
  if (![1, 2, 3].includes(loadout.slotIndex)) {
    return NextResponse.json({ error: "slotIndex must be 1, 2, or 3." }, { status: 400 });
  }
  const saved = await saveGooseLoadout(user.id, loadout);
  const state = await getFlockerroomState(user.id);
  return NextResponse.json({
    saved: saved.data,
    source: saved.source,
    message: saved.message,
    state
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const loadoutId = typeof body.loadoutId === "string" ? body.loadoutId : "";
  if (!loadoutId) return NextResponse.json({ error: "Missing loadoutId." }, { status: 400 });
  const updated = await setActiveGooseLoadout(user.id, loadoutId);
  const state = await getFlockerroomState(user.id);
  return NextResponse.json({
    loadouts: updated.data,
    source: updated.source,
    message: updated.message,
    state
  });
}
