import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addAudit } from "@/lib/auth/store";
import { createWalletProofChallenge } from "@/lib/wallet-proof";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in with Security Key before adding Wallet Proof." }, { status: 401 });

  const challenge = await createWalletProofChallenge(user);
  await addAudit(`${user.name} started an optional Wallet Proof challenge.`, "wallet");
  return NextResponse.json({ ok: true, ...challenge });
}
