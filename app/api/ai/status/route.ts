import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const ready = Boolean(process.env.MINIMAX_API_KEY || process.env.MINIMAX_API_TOKEN);
  return NextResponse.json({
    ready,
    provider: "MiniMax",
    mode: ready ? "configured" : "offline-demo-fallback",
    message: ready
      ? "MiniMax credentials are present, but this demo still keeps AI moves secondary to Security Key flows."
      : "MiniMax is not configured locally, so Play vs AI uses a deterministic offline demo opponent."
  });
}
