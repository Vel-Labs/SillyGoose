"use client";

import { UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";

export function JoinRoomPanel({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function joinRoom() {
    setError("");
    setStatus("Joining room with the authenticated Ledger credential...");
    try {
      const response = await fetch("/api/game/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, join: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join room.");
      setStatus("Joined as Player Two. Opening the room...");
      router.push(`/game/${data.room.id}`);
      router.refresh();
    } catch (joinError) {
      setStatus("");
      setError(joinError instanceof Error ? joinError.message : "Could not join room.");
    }
  }

  return (
    <div className="parchment poster-border w-full max-w-lg p-5 sm:p-7">
      <p className="text-xs font-black uppercase text-ink/60">Flock code</p>
      <h1 className="brush-title break-all text-4xl text-ink [text-shadow:2px_2px_0_#f4a51c]">{roomId}</h1>
      <p className="mt-3 text-sm font-black uppercase leading-relaxed text-ink/75">
        You are signed in. Join this game as Player Two with the browser WebAuthn credential attached to this session.
      </p>
      <div className="mt-5">
        <Button onClick={joinRoom} className="w-full">
          <UserCheck className="h-4 w-4" /> Join as Player Two
          <span className="security-key-pill">Verified session</span>
        </Button>
      </div>
      {status ? <p className="mt-3 rounded-sm bg-gooseblue px-3 py-2 text-xs font-black text-white">{status}</p> : null}
      {error ? <p className="mt-3 rounded-sm bg-ember px-3 py-2 text-xs font-black text-white">{error}</p> : null}
    </div>
  );
}
