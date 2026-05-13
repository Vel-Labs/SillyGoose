import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/brand-shell";
import { TicTacToeBoard } from "@/components/tic-tac-toe-board";
import { Button } from "@/components/ui/button";
import { VerifiedPlayerBadge } from "@/components/verified-player-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { readStore } from "@/lib/auth/store";
import { findGoose } from "@/lib/goose-roster";

export default async function GameRoomPage({ params, searchParams }: { params: Promise<{ roomId: string }>; searchParams: Promise<{ goose?: string }> }) {
  const { roomId } = await params;
  const { goose } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/game/${roomId}`)}`);
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.id === roomId);
  if (!room) redirect("/dashboard");
  const joinPath = `/join/${room.id}`;
  const playerOne = findGoose(goose ?? room.players.X?.goose);
  const playerTwo = room.players.O ? findGoose(room.players.O.goose) : null;

  return (
    <PageShell>
      <section className="app-width mx-auto h-full w-full px-4 pb-8 sm:px-6">
        <div className="poster-border game-frame h-full min-h-0 overflow-hidden p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="brush-title text-4xl text-white xl:text-5xl">Verified Tic-Tac-Toe</h1>
            <p className="room-code mt-1 inline-block px-4 py-2 text-xs">Room code: {room.id}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard"><Button variant="danger">Leave room</Button></Link>
          </div>
        </div>
        <div className="parchment poster-border mb-3 p-3">
          <p className="text-xs font-black uppercase text-ink/60">Give this to Player Two</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all rounded-sm border-2 border-black bg-white/70 px-3 py-2 text-sm font-black text-ink">
              {joinPath}
            </code>
            <Link href={joinPath}><Button variant="secondary">Open Join Page</Button></Link>
          </div>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[240px_1fr_240px]">
          <VerifiedPlayerBadge name={playerOne.shortName} label="Player One" side="red" goose={playerOne.key} featured />
          <TicTacToeBoard initialRoom={room} />
          <div>
            <VerifiedPlayerBadge name={playerTwo?.shortName ?? "Player Two Pending"} label="Player Two" side="blue" goose={playerTwo?.key ?? "jefe"} featured />
            {!room.players.O ? (
              <div className="mt-4 rounded-sm border-2 border-black bg-black/75 p-3 text-xs font-black uppercase text-parchment/75">
                Waiting for Player Two to open the join page and authenticate with their own Ledger Security Key.
              </div>
            ) : null}
          </div>
        </div>
        <div className="hardware-banner mx-auto mt-3 max-w-3xl p-3 text-center text-sm font-black uppercase text-parchment">
          Both players verified by Ledger Security Key
        </div>
        </div>
      </section>
    </PageShell>
  );
}
