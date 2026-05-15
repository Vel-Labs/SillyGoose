"use client";

import { Bot } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export function AiPlayerTwoButton({ roomId }: { roomId: string }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function assignAiPlayerTwo() {
    setStatus("Summoning AI Goose...");
    setError("");
    try {
      await postJson("/api/game/room", { roomId, aiPlayerTwo: true });
      window.location.reload();
    } catch (assignError) {
      setStatus("");
      setError(assignError instanceof Error ? assignError.message : "Could not assign AI Goose.");
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      <Button type="button" variant="secondary" onClick={assignAiPlayerTwo} className="min-h-9 px-3 py-1.5 text-xs">
        <Bot className="h-4 w-4" />
        Make Player Two AI
      </Button>
      {status ? <p className="rounded-sm bg-gooseblue px-3 py-2 text-[11px] font-black uppercase text-white">{status}</p> : null}
      {error ? <p className="rounded-sm bg-ember px-3 py-2 text-[11px] font-black uppercase text-white">{error}</p> : null}
    </div>
  );
}
