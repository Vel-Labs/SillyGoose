"use client";

import Image from "next/image";
import { Bot, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { GameRoom } from "@/lib/auth/store";
import { findGoose } from "@/lib/goose-roster";
import { Button } from "./ui/button";

type Props = {
  initialRoom: GameRoom;
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

export function TicTacToeBoard({ initialRoom }: Props) {
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState("");
  const [aiStatus, setAiStatus] = useState("Checking MiniMax readiness...");
  const playerX = findGoose(room.players.X?.goose);
  const playerO = room.players.O ? findGoose(room.players.O.goose) : null;
  const turnGoose = room.turn === "X" ? playerX : playerO;
  const winnerGoose = room.winner === "X" ? playerX : room.winner === "O" ? playerO : null;

  useEffect(() => {
    fetch("/api/ai/status")
      .then((response) => response.json())
      .then((status) => setAiStatus(status.message))
      .catch(() => setAiStatus("AI readiness check failed; offline fallback remains available."));
  }, []);

  async function move(index: number) {
    setError("");
    try {
      const data = await postJson("/api/game/move", { roomId: room.id, mark: room.turn, index });
      setRoom(data.room);
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "Move failed.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="turn-banner mx-auto w-fit px-8 py-2 text-sm">
        {room.winner ? "Match Complete" : turnGoose ? `${turnGoose.shortName}'s turn` : "Player Two pending"}
      </div>
      <div className="parchment poster-border game-board mx-auto grid aspect-square w-full max-w-[430px] grid-cols-3 grid-rows-3 p-[16%] xl:max-w-[480px]">
        <Image src="/reference-art/Gameboard.png" alt="" fill priority sizes="520px" className="object-cover" />
        {room.board.map((cell, index) => (
          <button
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            onClick={() => move(index)}
            disabled={Boolean(cell || room.winner)}
            className="relative z-10 flex items-center justify-center text-7xl font-black disabled:cursor-not-allowed sm:text-8xl"
          >
            <span className={`mark ${cell === "X" ? "mark-x" : "mark-o"}`}>{cell}</span>
          </button>
        ))}
      </div>
      {room.winner ? (
        <div className="winner-card poster-border relative overflow-hidden rounded-sm p-4 text-center">
          <Image src={room.winner === "draw" ? "/reference-art/end-game-screen.png" : "/reference-art/winner-screen.png"} alt="" fill sizes="640px" className="object-cover opacity-35" />
          <div className="relative">
            <p className="brush-title text-3xl text-white">
              {room.winner === "draw" ? "Mutual honk containment." : `${winnerGoose?.shortName ?? room.winner} claims the pond.`}
            </p>
            <p className="mt-1 text-xs font-black uppercase text-parchment/85">
              {room.winner === "draw" ? "Nobody blinked. Everybody honked." : winnerGoose?.catchphrase ?? "Verified move. Maximum feather drama."}
            </p>
          </div>
        </div>
      ) : null}
      <div className="rough-panel rounded-sm p-3 text-center">
        <p className="brush-title text-2xl text-signal">
          {room.winner ? (room.winner === "draw" ? "Draw. Honks evenly distributed." : `${winnerGoose?.shortName ?? room.winner} wins by verified honk.`) : turnGoose ? `${turnGoose.shortName} owns the next square.` : "Waiting for Player Two to verify."}
        </p>
        {room.aiMode ? (
          <p className="mt-2 flex items-center justify-center gap-2 text-xs font-black uppercase text-parchment/75">
            <Bot className="h-4 w-4 text-signal" /> {aiStatus}
          </p>
        ) : null}
        {error ? <p className="mt-3 rounded-sm bg-ember px-3 py-2 text-sm font-black text-white">{error}</p> : null}
      </div>
      <Button onClick={() => window.location.reload()} variant="ghost" className="w-full">
        <RotateCcw className="h-4 w-4" /> Refresh room
      </Button>
    </div>
  );
}
