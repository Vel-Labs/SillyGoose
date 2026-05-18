import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addAudit } from "@/lib/auth/store";
import { postBreadReward } from "@/lib/growth-loop";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before posting $Bread activity." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const kind = body.kind === "gg_tip" || body.kind === "friend_transfer" || body.kind === "stake_lock" || body.kind === "stake_release" ? body.kind : "reward";
  try {
    const transaction = await postBreadReward(user, kind);
    await addAudit(`${user.name} posted ${transaction.amount} demo $Bread (${transaction.kind}).`, "game");
    return NextResponse.json({ ok: true, transaction });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "$Bread update failed." }, { status: 400 });
  }
}
