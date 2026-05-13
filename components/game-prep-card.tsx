"use client";

import { useRouter } from "next/navigation";
import { Gamepad2, Sparkles } from "lucide-react";
import { useState } from "react";
import { findGoose, gooseRoster, type GooseKey } from "@/lib/goose-roster";
import { Button } from "./ui/button";

type GamePrepCardProps = {
  defaultGoose?: GooseKey;
};

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

export function GamePrepCard({ defaultGoose = "captain" }: GamePrepCardProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<GooseKey>(defaultGoose);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const activeGoose = findGoose(selected);

  async function openRoom(aiMode = false) {
    setError("");
    setStatus(aiMode ? "Preparing verified AI room..." : "Preparing verified game room...");
    try {
      const data = await postJson("/api/game/room", { aiMode, goose: selected });
      router.push(`/game/${data.room.id}?goose=${selected}`);
      router.refresh();
    } catch (roomError) {
      setStatus("");
      setError(roomError instanceof Error ? roomError.message : "Could not open the room.");
    }
  }

  return (
    <section className="poster-border dark-card p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="brush-strip mb-2 inline-block px-4 py-1 text-xs text-parchment">Game Prep</p>
          <h2 className="brush-title text-2xl text-white xl:text-3xl">Select your goose.</h2>
        </div>
        <Gamepad2 className="h-8 w-8 text-signal" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[140px_1fr]">
        <div className="goose-portrait goose-sprite selected-goose relative min-h-[165px] overflow-hidden" aria-label={activeGoose.name} style={{ backgroundPosition: activeGoose.sprite }} />
        <div>
          <div className="grid grid-cols-4 gap-2">
            {gooseRoster.map((goose) => (
              <button
                key={goose.key}
                type="button"
                onClick={() => setSelected(goose.key)}
                className={`goose-token ${selected === goose.key ? "goose-token-active" : ""}`}
                aria-label={`Select ${goose.name}`}
              >
                <span className="goose-sprite absolute inset-0" style={{ backgroundPosition: goose.sprite }} />
              </button>
            ))}
          </div>
          <div className="mt-2 rounded-sm border-2 border-black bg-parchment p-2 text-ink">
            <div className="text-[11px] font-black uppercase text-ink/60">Selected operator</div>
            <div className="brush-title text-2xl text-ink [text-shadow:2px_2px_0_#f4a51c]">{activeGoose.shortName}</div>
            <div className="text-xs font-black uppercase text-ember">Honk rating: {activeGoose.rating.toLocaleString()}</div>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => openRoom(false)} className="w-full">
              <Gamepad2 className="h-4 w-4" /> New Game
            </Button>
            <Button onClick={() => openRoom(true)} variant="secondary" className="w-full">
              <Sparkles className="h-4 w-4" /> Play vs AI
            </Button>
          </div>
          {status ? <p className="mt-3 rounded-sm bg-gooseblue px-3 py-2 text-xs font-black uppercase text-white">{status}</p> : null}
          {error ? <p className="mt-3 rounded-sm bg-ember px-3 py-2 text-xs font-black uppercase text-white">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
