"use client";

import Link from "next/link";
import { Eye, RotateCcw } from "lucide-react";
import { useState } from "react";
import { CopyInviteButton } from "./copy-invite-button";

export function GameRoomActions({ joinPath, spectatorPath }: { joinPath: string; spectatorPath: string }) {
  const [spectatorOpen, setSpectatorOpen] = useState(false);

  return (
    <div className="game-actions">
      <button type="button" onClick={() => setSpectatorOpen((open) => !open)} className="wood-sign nav-wood-sign px-3 py-2">
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
      {spectatorOpen ? (
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
