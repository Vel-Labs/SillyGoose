import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addAudit } from "@/lib/auth/store";
import { verifyWalletProof } from "@/lib/wallet-proof";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in with Security Key before adding Wallet Proof." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const challengeId = String(body.challengeId ?? "");
  const address = String(body.address ?? "");
  const signature = String(body.signature ?? "");
  const chain = typeof body.chain === "string" ? body.chain : undefined;

  if (!challengeId || !address || !signature) {
    return NextResponse.json({ error: "Wallet Proof needs a challenge, address, and signature." }, { status: 400 });
  }

  try {
    const wallet = await verifyWalletProof({ userId: user.id, challengeId, address, signature, chain });
    await addAudit(`${user.name} linked Wallet Proof ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}.`, "wallet");
    return NextResponse.json({ ok: true, wallet });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Wallet Proof verification failed." }, { status: 400 });
  }
}
