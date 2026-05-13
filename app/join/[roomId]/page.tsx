import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/brand-shell";
import { GooseLoginPanel } from "@/components/goose-login-panel";
import { JoinRoomPanel } from "@/components/join-room-panel";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { readStore } from "@/lib/auth/store";

export default async function JoinRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const store = await readStore();
  const room = store.rooms.find((candidate) => candidate.id === roomId);
  if (!room) redirect("/dashboard");

  const user = await getCurrentUser();
  const next = `/join/${roomId}`;
  const isHost = Boolean(user && room.players.X?.userId === user.id);
  const isPlayerTwo = Boolean(user && room.players.O?.userId === user.id);
  const lockedForViewer = Boolean(room.players.O && !isPlayerTwo);

  return (
    <PageShell>
      <section className="mx-auto flex min-h-[calc(100dvh-170px)] w-full max-w-5xl flex-col items-center justify-center gap-5 px-4 py-10">
        {user ? (
          <JoinRoomPanel roomId={roomId} locked={lockedForViewer} isHost={isHost} />
        ) : (
          <>
            <div className="rough-panel max-w-lg rounded-sm p-4 text-center text-sm font-black uppercase text-parchment/80">
              {room.players.O
                ? `Flock ${roomId} already has two verified players. Sign in if this is your room, or view it as a spectator.`
                : `Player Two must sign in or register with their own Ledger Security Key before joining flock ${roomId}.`}
            </div>
            {!room.players.O ? <GooseLoginPanel redirectTo={next} /> : null}
          </>
        )}
        <Link href={`/game/${roomId}`}>
          <Button variant="ghost" className="border-black bg-black/80 text-parchment">
            View room
          </Button>
        </Link>
      </section>
    </PageShell>
  );
}
