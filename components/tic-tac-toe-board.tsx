"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GameRoom } from "@/lib/auth/store";
import { findGoose } from "@/lib/goose-roster";

type Props = {
  initialRoom: GameRoom;
  viewerMark: "X" | "O" | null;
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

export function TicTacToeBoard({ initialRoom, viewerMark }: Props) {
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [honkBurst, setHonkBurst] = useState(0);
  const [footprints, setFootprints] = useState<Array<{ id: number; side: "left" | "right"; top: number }>>([]);
  const [rematchLoading, setRematchLoading] = useState(false);
  const moveCountRef = useRef(initialRoom.moves.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerX = findGoose(room.players.X?.goose);
  const playerO = room.players.O ? findGoose(room.players.O.goose) : null;
  const turnGoose = room.turn === "X" ? playerX : playerO;
  const winnerGoose = room.winner === "X" ? playerX : room.winner === "O" ? playerO : null;
  const playerXLoadingImage = `/geese/headshots/${playerX.key}.png`;
  const playerOLoadingImage = `/geese/headshots/${(playerO ?? playerX).key}.png`;
  const isYourTurn = Boolean(viewerMark && room.turn === viewerMark && !room.winner);
  const canMove = Boolean(isYourTurn && !isMoving);
  const rematchNeeded = room.aiMode || room.players.O ? 2 : 1;
  const rematchCount = Math.min(room.rematchVotes?.length ?? 0, rematchNeeded);
  const viewerHasVoted = Boolean(room.rematchVotes?.some((vote) => room.players[viewerMark ?? "X"]?.userId === vote));

  useEffect(() => {
    audioRef.current = new Audio("/honk.mp3");
  }, []);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/game/room?roomId=${room.id}`, { cache: "no-store" });
        const data = await response.json();
        if (data.room) {
          if (room.winner && !data.room.winner && data.room.moves.length === 0) {
            showRematchLoading();
            moveCountRef.current = 0;
            setFootprints([]);
          }
          setRoom(data.room);
        }
      } catch {
        // Polling is best-effort; direct move errors still surface below.
      }
    }, 1800);
    return () => window.clearInterval(interval);
  }, [room.id, room.winner]);

  useEffect(() => {
    if (room.moves.length <= moveCountRef.current) return;
    moveCountRef.current = room.moves.length;
    playHonk();
    setHonkBurst((value) => value + 1);
    const side: "left" | "right" = room.moves.length % 2 === 0 ? "right" : "left";
    const nextPrints = Array.from({ length: 3 }, (_, offset) => ({
      id: Date.now() + offset,
      side,
      top: 18 + ((room.moves.length * 13 + offset * 19) % 64)
    }));
    setFootprints((current) => [...current.slice(-11), ...nextPrints]);
  }, [room.moves.length]);

  function playHonk() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browsers block sound before the first user gesture; visual feedback still runs.
    });
  }

  async function move(index: number) {
    if (!canMove || room.board[index]) return;
    setError("");
    setIsMoving(true);
    try {
      playHonk();
      const data = await postJson("/api/game/move", { roomId: room.id, index });
      setRoom(data.room);
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "Move failed.");
    } finally {
      setIsMoving(false);
    }
  }

  async function playAgain() {
    setError("");
    setIsMoving(true);
    try {
      const data = await postJson("/api/game/room", { roomId: room.id, reset: true });
      if (data.reset) {
        showRematchLoading();
        moveCountRef.current = 0;
        setFootprints([]);
      }
      setRoom(data.room);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Could not reset the room.");
    } finally {
      setIsMoving(false);
    }
  }

  function showRematchLoading() {
    setRematchLoading(true);
    window.setTimeout(() => setRematchLoading(false), 1700);
  }

  return (
    <div className="space-y-3">
      <div className="game-board-stage mx-auto">
        <div className="turn-banner mx-auto flex w-fit items-center gap-2 px-8 py-2 text-sm">
          {!viewerMark ? <Eye className="h-4 w-4" /> : null}
          {room.winner ? "Match Complete" : isYourTurn ? "Your turn" : turnGoose ? `${turnGoose.shortName}'s turn` : "Player Two pending"}
        </div>
        {!room.winner && turnGoose ? (
          <div className={`turn-side-callout ${room.turn === "X" ? "turn-side-callout-left" : "turn-side-callout-right"}`}>
            <p>Duck...Duck..</p>
            <p>GOOSE!</p>
            <strong>Your turn</strong>
          </div>
        ) : null}
        <div className="parchment poster-border game-board mx-auto aspect-square w-full max-w-[430px] xl:max-w-[480px]">
          <Image src="/reference-art/Gameboard.png" alt="" fill priority sizes="520px" className="object-cover" />
          {footprints.map((print) => (
            <span key={print.id} className={`goose-footprint goose-footprint-${print.side}`} style={{ top: `${print.top}%` }} aria-hidden="true">
              oo
            </span>
          ))}
          {room.board.map((cell, index) => (
            <button
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              onClick={() => move(index)}
              disabled={Boolean(cell || room.winner || !canMove)}
              className="board-cell z-10 flex items-center justify-center text-7xl font-black disabled:cursor-not-allowed sm:text-8xl"
              style={{
                left: `${16 + (index % 3) * 22.6}%`,
                top: `${16 + Math.floor(index / 3) * 22.6}%`
              }}
            >
              <span className={`mark ${cell === "X" ? "mark-x" : "mark-o"}`}>{cell}</span>
            </button>
          ))}
        </div>
      </div>
      <div key={honkBurst} className="screen-goose-crossing" aria-hidden="true">
        {[playerX, playerO ?? playerX, turnGoose ?? playerX].map((goose, index) => (
          <span key={`${goose.key}-${index}`} className="screen-goose-crossing-bird" style={{ animationDelay: `${index * 0.28}s` }}>
            <Image src={goose.image} alt="" width={78} height={78} className="h-full w-full object-contain" />
          </span>
        ))}
      </div>
      {rematchLoading ? (
        <div className="winner-modal-backdrop" role="dialog" aria-modal="true" aria-label="Loading rematch">
          <div className="winner-modal loading-modal poster-border">
            <Image src="/reference-art/game-loading-screen-empty.png" alt="" fill sizes="900px" priority className="winner-modal-image" />
            <div className="loading-goose loading-goose-left">
              <Image src={playerXLoadingImage} alt="" fill sizes="210px" className="object-contain" />
            </div>
            <div className="loading-goose loading-goose-right">
              <Image src={playerOLoadingImage} alt="" fill sizes="210px" className="object-contain" />
            </div>
          </div>
        </div>
      ) : room.winner ? (
        <div className="winner-modal-backdrop" role="dialog" aria-modal="true" aria-label="Match complete">
          <div className="winner-modal poster-border">
            <div className="winner-modal-top">
              <div className="turn-banner flex w-fit items-center gap-2 px-6 py-2 text-sm">
                Match Complete
              </div>
              {viewerMark ? (
                <button type="button" onClick={playAgain} disabled={viewerHasVoted || isMoving} className="play-again-chip">
                  Play again? {rematchCount}/{rematchNeeded}
                </button>
              ) : null}
            </div>
            <div className="winner-modal-art">
              <Image src={room.winner === "draw" ? "/reference-art/end-game-screen.png" : "/reference-art/winner-screen.png"} alt="" fill sizes="900px" priority className="winner-modal-image" />
            </div>
            <div className="winner-modal-copy">
              <p className="brush-title text-4xl text-white">
                {room.winner === "draw" ? "Mutual honk containment." : `${winnerGoose?.shortName ?? room.winner} claims the pond.`}
              </p>
              <p className="mt-2 text-sm font-black uppercase text-parchment/90">
                {room.winner === "draw" ? "Nobody blinked. Everybody honked." : winnerGoose?.catchphrase ?? "Verified move. Maximum feather drama."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {error ? <p className="rounded-sm bg-ember px-3 py-2 text-center text-sm font-black text-white">{error}</p> : null}
    </div>
  );
}
