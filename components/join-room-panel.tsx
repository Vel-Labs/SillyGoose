"use client";

import { CheckCircle2, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { findGoose, gooseRoster, type GooseKey } from "@/lib/goose-roster";
import { Button } from "./ui/button";

type Props = {
  roomId: string;
  locked?: boolean;
  isHost?: boolean;
};

export function JoinRoomPanel({ roomId, locked = false, isHost = false }: Props) {
  const router = useRouter();
  const [selectedGoose, setSelectedGoose] = useState<GooseKey>("jefe");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const activeGoose = findGoose(selectedGoose);

  useEffect(() => {
    const stored = window.localStorage.getItem("silly-goose.preferred-goose");
    if (stored) setSelectedGoose(findGoose(stored).key);
  }, []);

  async function joinRoom() {
    if (locked || isHost) {
      router.push(`/game/${roomId}`);
      return;
    }
    setError("");
    setStatus(`Joining room as ${activeGoose.shortName} with the authenticated Ledger credential...`);
    try {
      const response = await fetch("/api/game/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, join: true, goose: selectedGoose })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join room.");
      window.localStorage.setItem("silly-goose.preferred-goose", selectedGoose);
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
        {locked
          ? "This game already has two verified players. You can spectate the live board and replayed moves."
          : isHost
            ? "You opened this flock. Share the invite with another verified Ledger Security Key user."
            : "You are signed in. Name your account through the login handle, pick your preferred goose, then join as Player Two."}
      </p>
      {!locked && !isHost ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {gooseRoster.filter((goose) => goose.key !== "ai").map((goose) => (
            <button
              key={goose.key}
              type="button"
              onClick={() => setSelectedGoose(goose.key)}
              className={`goose-token min-h-[62px] ${selectedGoose === goose.key ? "goose-token-active" : ""}`}
              aria-label={`Pick ${goose.name}`}
            >
              <span className="goose-token-name min-h-full border-t-0 px-2 text-[10px]">{goose.shortName}</span>
              {selectedGoose === goose.key ? <CheckCircle2 className="goose-token-check h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-5">
        <Button onClick={joinRoom} className="w-full">
          <UserCheck className="h-4 w-4" /> {locked || isHost ? "Open Spectator View" : `Join as ${activeGoose.shortName}`}
          {!locked && !isHost ? <span className="security-key-pill">Verified session</span> : null}
        </Button>
      </div>
      {status ? <p className="mt-3 rounded-sm bg-gooseblue px-3 py-2 text-xs font-black text-white">{status}</p> : null}
      {error ? <p className="mt-3 rounded-sm bg-ember px-3 py-2 text-xs font-black text-white">{error}</p> : null}
    </div>
  );
}
