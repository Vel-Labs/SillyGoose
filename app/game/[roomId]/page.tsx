import { redirect } from "next/navigation";
import { AiPlayerTwoButton } from "@/components/ai-player-two-button";
import { MysteryGooseCard } from "@/components/arcade-primitives";
import { PageShell } from "@/components/brand-shell";
import { GameRoomActions } from "@/components/game-room-actions";
import { TicTacToeBoard } from "@/components/tic-tac-toe-board";
import { VerifiedPlayerBadge } from "@/components/verified-player-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { readStore } from "@/lib/auth/store";
import { markForUser } from "@/lib/game/engine";
import { findGoose } from "@/lib/goose-roster";

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function playerLabel(user: { handle: string; name: string } | undefined) {
  return user?.handle || user?.name || "Verified Player";
}

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
  const usersById = new Map(store.users.map((candidate) => [candidate.id, candidate]));
  const leaderboard = [...(store.playerStats ?? [])]
    .sort((a, b) => b.wins - a.wins || b.gamesPlayed - a.gamesPlayed || b.winRate - a.winRate || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
    .map((stats) => {
      const entryUser = usersById.get(stats.userId);
      return {
        userId: stats.userId,
        name: entryUser?.name ?? "Verified Goose",
        handle: entryUser?.handle ?? "0xUnknown-Goose",
        wins: stats.wins,
        gamesPlayed: stats.gamesPlayed,
        winRate: stats.winRate
      };
  });
  const history = store.outcomes.slice(0, 5).map((outcome) => {
    const winner = outcome.winner === "draw"
      ? "Draw"
      : `${playerLabel(usersById.get(outcome.players[outcome.winner]?.userId ?? ""))} won`;
    return {
      id: outcome.id,
      title: winner,
      detail: `${outcome.moves.length} verified moves in ${outcome.roomId}`,
      completedAt: formatShortDate(outcome.completedAt)
    };
  });

  return (
    <PageShell>
      <section className="app-width mx-auto w-full px-4 pb-2 sm:px-6">
        <div className="poster-border game-frame game-room-shell game-room-viewport">
        <div className="game-room-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="brush-title text-3xl leading-none text-white xl:text-4xl">Verified Tic-Tac-Toe</h1>
            <p className="room-code mt-1 inline-block px-4 py-2 text-xs">Flock code: {room.id}</p>
            {isSpectator ? <p className="mt-2 text-xs font-black uppercase text-parchment/70">Spectator view. Verified players own the board.</p> : null}
          </div>
          <GameRoomActions joinPath={joinPath} spectatorPath={spectatorPath} leaderboard={leaderboard} history={history} />
        </div>
        <div className="game-room-layout grid items-start gap-4 lg:grid-cols-[210px_minmax(520px,1fr)_210px]">
          <VerifiedPlayerBadge name={playerOne.shortName} label="Player One" side="red" goose={playerOne.key} featured />
          <TicTacToeBoard initialRoom={room} viewerMark={viewerMark} />
          <div>
            {room.aiMode && playerTwo ? (
              <VerifiedPlayerBadge name={`${playerTwo.shortName} AI`} label="Player Two" side="blue" goose={playerTwo.key} featured verified />
            ) : room.aiMode ? (
              <MysteryGooseCard mode="ai" />
            ) : playerTwo ? (
              <VerifiedPlayerBadge name={playerTwo.shortName} label="Player Two" side="blue" goose={playerTwo.key} featured verified />
            ) : (
              <MysteryGooseCard />
            )}
            {!room.players.O ? (
              <div className="mt-4 rounded-sm border-2 border-black bg-black/75 p-3 text-xs font-black uppercase text-parchment/75">
                Awaiting Rival Goose. Waiting for Player Two to open the join page and authenticate with their Ledger Security Key.
                {viewerMark === "X" ? <AiPlayerTwoButton roomId={room.id} /> : null}
              </div>
            ) : null}
          </div>
        </div>
        </div>
      </section>
    </PageShell>
  );
}
