"use client";

import { UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";

export function PlayerTwoJoin({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function join() {
    setError("");
    setStatus("Marking Player Two as verified for the local demo...");
    try {
      const response = await fetch("/api/game/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, join: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join room.");
      setStatus("Player Two joined with marked local verification.");
      router.refresh();
    } catch (joinError) {
      setStatus("");
      setError(joinError instanceof Error ? joinError.message : "Player Two join failed.");
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <Button onClick={join} variant="secondary" className="w-full">
        <UserCheck className="h-4 w-4" /> Verify Player Two
      </Button>
      <p className="text-xs font-black uppercase text-parchment/65">
        Uses the current local session as a marked fallback join. Real second-device WebAuthn remains the live-demo path when hardware is available.
      </p>
      {status ? <p className="rounded-sm bg-gooseblue px-3 py-2 text-xs font-black text-white">{status}</p> : null}
      {error ? <p className="rounded-sm bg-ember px-3 py-2 text-xs font-black text-white">{error}</p> : null}
    </div>
  );
}
