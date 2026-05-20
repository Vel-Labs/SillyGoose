import Link from "next/link";
import { Medal, ShieldCheck, Trophy } from "lucide-react";
import { Panel, SectionHeader, StatusBadge } from "@/components/arcade-primitives";
import { PageShell } from "@/components/brand-shell";
import { readStore } from "@/lib/auth/store";

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function playerLabel(user: { handle: string; name: string } | undefined) {
  return user?.handle || user?.name || "Verified Player";
}

export default async function LeaderboardPage() {
  const store = await readStore();
  const usersById = new Map(store.users.map((user) => [user.id, user]));
  const leaderboard = [...(store.playerStats ?? [])]
    .sort((a, b) => b.wins - a.wins || b.gamesPlayed - a.gamesPlayed || b.winRate - a.winRate || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 12);
  const recentOutcomes = store.outcomes.slice(0, 8);

  return (
    <PageShell>
      <section className="app-width mx-auto w-full px-4 pb-2 sm:px-6">
        <div className="poster-border dashboard-frame p-3">
          <div className="grid gap-3 xl:grid-cols-[1fr_.7fr]">
            <Panel className="compact-profile-section p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionHeader className="min-w-[220px] flex-1">Verified Leaderboard</SectionHeader>
                <StatusBadge tone="verified">Saved outcomes</StatusBadge>
              </div>
              <div className="mt-3 grid gap-2">
                {leaderboard.length ? leaderboard.map((stats, index) => {
                  const user = usersById.get(stats.userId);
                  return (
                    <div key={stats.userId} className="leaderboard-page-row">
                      <div className="leaderboard-rank">
                        {index === 0 ? <Trophy className="h-5 w-5" /> : <Medal className="h-5 w-5" />}
                        #{index + 1}
                      </div>
                      <div className="min-w-0">
                        <strong>{user?.handle ?? "0xUnknown-Goose"}</strong>
                        <span>{user?.name ?? "Verified Goose"}</span>
                      </div>
                      <div className="leaderboard-metric">
                        <strong>{stats.wins}</strong>
                        <span>Wins</span>
                      </div>
                      <div className="leaderboard-metric">
                        <strong>{stats.gamesPlayed}</strong>
                        <span>Games</span>
                      </div>
                      <div className="leaderboard-metric">
                        <strong>{stats.winRate}%</strong>
                        <span>Rate</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="activity-row">
                    <ShieldCheck className="h-5 w-5 text-signal" />
                    <span>No completed games have been saved yet.</span>
                  </div>
                )}
              </div>
            </Panel>

            <Panel className="compact-profile-section p-3">
              <SectionHeader>Recent History</SectionHeader>
              <div className="mt-3 grid gap-2">
                {recentOutcomes.length ? recentOutcomes.map((outcome) => {
                  const winner = outcome.winner === "draw"
                    ? "Draw"
                    : `${playerLabel(usersById.get(outcome.players[outcome.winner]?.userId ?? ""))} won`;
                  return (
                    <Link key={outcome.id} href={`/game/${outcome.roomId}`} className="activity-row no-underline">
                      <Trophy className="h-5 w-5 text-signal" />
                      <span>{winner} / {outcome.moves.length} moves</span>
                      <strong>{formatShortDate(outcome.completedAt)}</strong>
                    </Link>
                  );
                }) : (
                  <div className="activity-row">
                    <ShieldCheck className="h-5 w-5 text-signal" />
                    <span>Finish a match to create history.</span>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
