"use client";

import { Gamepad2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";

export function NewGameButton({ aiMode = false }: { aiMode?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function createGame() {
    setError("");
    setStatus("Creating verified game room...");
    try {
      const response = await fetch("/api/game/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiMode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create room.");
      router.push(`/game/${data.room.id}`);
      router.refresh();
    } catch (createError) {
      setStatus("");
      setError(createError instanceof Error ? createError.message : "Could not create room.");
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={createGame} className="w-full">
        <Gamepad2 className="h-4 w-4" /> New Game
      </Button>
      {status ? <p className="rounded-sm bg-gooseblue px-3 py-2 text-xs font-black text-white">{status}</p> : null}
      {error ? <p className="rounded-sm bg-ember px-3 py-2 text-xs font-black text-white">{error}</p> : null}
    </div>
  );
}
