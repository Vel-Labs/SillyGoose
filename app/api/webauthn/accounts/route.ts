import { NextResponse } from "next/server";
import { getRegisteredAccounts } from "@/lib/auth/store";

export const runtime = "nodejs";

export async function GET() {
  const accounts = await getRegisteredAccounts();
  return NextResponse.json({ accounts });
}
