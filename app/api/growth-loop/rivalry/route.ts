import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addAudit } from "@/lib/auth/store";
import { prepareRivalryTypedData, recordSignedRivalry } from "@/lib/growth-loop";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before creating a signed rivalry." }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  try {
    if (!body.signature) {
      const prepared = await prepareRivalryTypedData(user);
      return NextResponse.json({ ok: true, needsSignature: true, ...prepared });
    }
    const challenge = await recordSignedRivalry(user, {
      typedData: body.typedData,
      nonce: String(body.nonce),
      expiresAt: String(body.expiresAt),
      linkedWalletId: String(body.linkedWalletId),
      walletAddress: String(body.walletAddress),
      rivalUserId: String(body.rivalUserId),
      signature: String(body.signature)
    });
    await addAudit(`${user.name} created an off-chain signed rivalry challenge.`, "wallet");
    return NextResponse.json({ ok: true, challenge });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signed rivalry failed." }, { status: 400 });
  }
}
