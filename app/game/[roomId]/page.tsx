import { redirect } from "next/navigation";
import { PageShell } from "@/components/brand-shell";
import { GameRoomActions } from "@/components/game-room-actions";
import { TicTacToeBoard } from "@/components/tic-tac-toe-board";
import { VerifiedPlayerBadge } from "@/components/verified-player-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { readStore } from "@/lib/auth/store";
import { markForUser } from "@/lib/game/engine";
import { findGoose } from "@/lib/goose-roster";

export default async function GameRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const user = await getCurrentUser();
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.id === roomId);
  if (!room) redirect("/dashboard");
  const joinPath = `/join/${room.id}`;
  const spectatorPath = `/game/${room.id}`;
  const viewerMark = user ? markForUser(room, user.id) : null;
  const isSpectator = !viewerMark;
  const playerOne = findGoose(room.players.X?.goose);
  const playerTwo = room.players.O ? findGoose(room.players.O.goose) : null;

  return (
    <PageShell>
      <section className="app-width mx-auto w-full px-4 pb-4 sm:px-6">
        <div className="poster-border game-frame game-room-shell min-h-[calc(100dvh-170px)] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="brush-title text-4xl text-white xl:text-5xl">Verified Tic-Tac-Toe</h1>
            <p className="room-code mt-1 inline-block px-4 py-2 text-xs">Flock code: {room.id}</p>
            {isSpectator ? <p className="mt-2 text-xs font-black uppercase text-parchment/70">Spectator view. Verified players own the board.</p> : null}
          </div>
          <GameRoomActions joinPath={joinPath} spectatorPath={spectatorPath} />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[240px_1fr_240px]">
          <VerifiedPlayerBadge name={playerOne.shortName} label="Player One" side="red" goose={playerOne.key} featured />
          <TicTacToeBoard initialRoom={room} viewerMark={viewerMark} />
          <div>
            <VerifiedPlayerBadge name={playerTwo?.shortName ?? "Player Two Pending"} label="Player Two" side="blue" goose={playerTwo?.key ?? "jefe"} featured verified={Boolean(room.players.O)} />
            {!room.players.O ? (
              <div className="mt-4 rounded-sm border-2 border-black bg-black/75 p-3 text-xs font-black uppercase text-parchment/75">
                Waiting for Player Two to open the join page and authenticate with their own Ledger Security Key.
              </div>
            ) : null}
          </div>
        </div>
        </div>
      </section>
    </PageShell>
  );
}
