"use client";

import Link from "next/link";
import { Clock3, Eye, RotateCcw, Trophy } from "lucide-react";
import { useState } from "react";
import { CopyInviteButton } from "./copy-invite-button";

export type LeaderboardEntry = {
  userId: string;
  name: string;
  handle: string;
  wins: number;
  gamesPlayed: number;
  winRate: number;
};

export type MatchHistoryEntry = {
  id: string;
  title: string;
  detail: string;
  completedAt: string;
};

type GameRoomActionsProps = {
  joinPath: string;
  spectatorPath: string;
  leaderboard: LeaderboardEntry[];
  history: MatchHistoryEntry[];
};

export function GameRoomActions({ joinPath, spectatorPath, leaderboard, history }: GameRoomActionsProps) {
  const [activePopover, setActivePopover] = useState<"leaderboard" | "history" | "spectator" | null>(null);

  return (
    <div className="game-actions">
      <button type="button" onClick={() => setActivePopover((open) => open === "leaderboard" ? null : "leaderboard")} className="wood-sign nav-wood-sign px-3 py-2">
        <Trophy className="h-4 w-4" />
        Leaderboard
      </button>
      <button type="button" onClick={() => setActivePopover((open) => open === "history" ? null : "history")} className="wood-sign nav-wood-sign px-3 py-2">
        <Clock3 className="h-4 w-4" />
        History
      </button>
      <button type="button" onClick={() => setActivePopover((open) => open === "spectator" ? null : "spectator")} className="wood-sign nav-wood-sign px-3 py-2">
        <Eye className="h-4 w-4" />
        Spectator
      </button>
      <button type="button" onClick={() => window.location.reload()} className="wood-sign nav-wood-sign px-3 py-2">
        <RotateCcw className="h-4 w-4" />
        Refresh room
      </button>
      <Link className="wood-sign nav-wood-sign px-3 py-2" href="/dashboard">
        Leave room
      </Link>
      {activePopover === "leaderboard" ? (
        <div className="spectator-popover game-actions-popover">
          <p className="text-[11px] font-black uppercase text-signal">Verified Tic-Tac-Toe leaderboard</p>
          <div className="mt-2 grid gap-2">
            {leaderboard.length ? leaderboard.map((entry, index) => (
              <div key={entry.userId} className="leaderboard-row">
                <span>#{index + 1}</span>
                <strong>{entry.handle || entry.name}</strong>
                <em>{entry.wins}W / {entry.gamesPlayed}G / {entry.winRate}%</em>
              </div>
            )) : (
              <div className="leaderboard-row leaderboard-row-empty">No completed matches yet.</div>
            )}
          </div>
        </div>
      ) : null}
      {activePopover === "history" ? (
        <div className="spectator-popover game-actions-popover">
          <p className="text-[11px] font-black uppercase text-signal">Recent saved match history</p>
          <div className="mt-2 grid gap-2">
            {history.length ? history.map((entry) => (
              <div key={entry.id} className="leaderboard-row">
                <span>{entry.completedAt}</span>
                <strong>{entry.title}</strong>
                <em>{entry.detail}</em>
              </div>
            )) : (
              <div className="leaderboard-row leaderboard-row-empty">Finish a match to save history.</div>
            )}
          </div>
        </div>
      ) : null}
      {activePopover === "spectator" ? (
        <div className="spectator-popover">
          <p className="text-[11px] font-black uppercase text-signal">Visitors can spectate this tic-tac-toe match.</p>
          <code className="mt-2 block break-all rounded-sm border-2 border-black bg-white/80 px-2 py-1 text-xs font-black text-ink">{spectatorPath}</code>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopyInviteButton invitePath={spectatorPath} label="Copy spectator" />
            <Link href={spectatorPath} className="wood-sign nav-wood-sign px-3 py-2 text-[11px]">
              Open spectator
            </Link>
            <Link href={joinPath} className="wood-sign nav-wood-sign px-3 py-2 text-[11px]">
              Player Two invite
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
