"use client";

import { useRouter } from "next/navigation";
import { Anchor, Gamepad2, Grid2X2, LockKeyhole, Radar, ShipWheel, Swords, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

type GameCard = {
  title: string;
  status: string;
  description: string;
  icon: LucideIcon;
  available?: boolean;
};

const games: GameCard[] = [
  {
    title: "Tic-Tac-Toe",
    status: "Playable now",
    description: "Open a verified two-player room with Security Key-backed turns.",
    icon: Grid2X2,
    available: true
  },
  {
    title: "Battleship",
    status: "Coming soon",
    description: "Fleet placement, verified salvos, and dramatic pond warfare.",
    icon: ShipWheel
  },
  {
    title: "Connect 4",
    status: "Coming soon",
    description: "Drop tokens, block lines, and settle flock disputes vertically.",
    icon: Swords
  },
  {
    title: "Pond Racers",
    status: "Coming soon",
    description: "A lane-based sprint for operators with suspicious confidence.",
    icon: Anchor
  },
  {
    title: "Honk Memory",
    status: "Coming soon",
    description: "Match goose tells, badges, and questionable pond evidence.",
    icon: Radar
  }
];

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

export function GameLibrary() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function openTicTacToe() {
    setStatus("Opening verified Tic-Tac-Toe...");
    setError("");
    try {
      const goose = window.localStorage.getItem("silly-goose.preferred-goose") ?? "captain";
      const data = await postJson("/api/game/room", { aiMode: false, goose });
      router.push(`/game/${data.room.id}`);
      router.refresh();
    } catch (roomError) {
      setStatus("");
      setError(roomError instanceof Error ? roomError.message : "Could not open Tic-Tac-Toe.");
    }
  }

  return (
    <section id="games" className="dark-card scroll-mt-6 p-3">
      <div className="section-divider">
        <span>Games</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <article key={game.title} className={`game-library-card ${game.available ? "game-library-card-ready" : "game-library-card-locked"}`}>
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-7 w-7 text-signal" />
                <span className={game.available ? "game-status-ready" : "game-status-soon"}>
                  {game.available ? <Gamepad2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                  {game.status}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-black uppercase leading-none text-white">{game.title}</h3>
              <p className="mt-2 min-h-[54px] text-xs font-black uppercase leading-snug text-parchment/70">{game.description}</p>
              {game.available ? (
                <Button onClick={openTicTacToe} className="mt-3 min-h-9 w-full px-2 text-xs">
                  Play
                </Button>
              ) : (
                <button type="button" disabled className="coming-soon-button mt-3 w-full">
                  Coming soon
                </button>
              )}
            </article>
          );
        })}
      </div>
      {status ? <p className="mt-3 rounded-sm bg-gooseblue px-3 py-2 text-xs font-black uppercase text-white">{status}</p> : null}
      {error ? <p className="mt-3 rounded-sm bg-ember px-3 py-2 text-xs font-black uppercase text-white">{error}</p> : null}
    </section>
  );
}
