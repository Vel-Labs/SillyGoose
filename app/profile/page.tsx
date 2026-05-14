import { redirect } from "next/navigation";
import { Crown, Gamepad2, Medal, ShieldCheck, Sparkles, Trophy, Users, type LucideIcon } from "lucide-react";
import { AdminAddUserCard } from "@/components/admin-add-user-card";
import { PageShell } from "@/components/brand-shell";
import { GoosePortrait } from "@/components/goose-portrait";
import { getCurrentUser } from "@/lib/auth/session";
import { readStore, type GameOutcome } from "@/lib/auth/store";
import { findGoose } from "@/lib/goose-roster";

type GameStats = {
  played: number;
  wins: number;
  losses: number;
  draws: number;
};

const gameLabels: Record<GameOutcome["gameKey"], string> = {
  tictac: "Tic-Tac-Toe"
};

const comingSoonStats = [
  { game: "Battleship", note: "No fleet records yet." },
  { game: "Connect 4", note: "No token drops yet." },
  { game: "Pond Racers", note: "No starting horn yet." }
];

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const store = await readStore();
  const outcomes = store.outcomes.filter((outcome) => {
    return outcome.players.X?.userId === user.id || outcome.players.O?.userId === user.id;
  });
  const preferredGoose = findGoose((outcomes[0]?.players.X?.userId === user.id ? outcomes[0]?.players.X?.goose : outcomes[0]?.players.O?.goose) ?? "captain");
  const stats = buildStats(outcomes, user.id);
  const total = stats.tictac;
  const rival = findRival(outcomes, user.id, store.users);
  const winRate = total.played ? Math.round((total.wins / total.played) * 100) : 0;
  const achievements = [
    {
      title: "Verified Competitor",
      detail: "Standard achievement builder planned.",
      icon: ShieldCheck
    },
    {
      title: "Pond Regular",
      detail: "Standard achievement builder planned.",
      icon: Medal
    },
    {
      title: "Clean Sweep",
      detail: "Standard achievement builder planned.",
      icon: Trophy
    }
  ];

  return (
    <PageShell>
      <section className="app-width mx-auto w-full px-4 pb-4 sm:px-6">
        <div className="poster-border dashboard-frame min-h-[calc(100dvh-170px)] p-3 sm:p-4">
          <div className="grid gap-3 xl:grid-cols-[300px_1fr]">
            <aside className="dark-card p-4">
              <div className="section-divider">
                <span>Profile</span>
              </div>
              <GoosePortrait goose={preferredGoose.key} className="mt-4 min-h-[280px] selected-goose" priority imageClassName="goose-framed-image" />
              <div className="mt-4 rounded-sm border-2 border-black bg-parchment p-3 text-ink shadow-[4px_4px_0_rgba(0,0,0,.28)]">
                <p className="text-[11px] font-black uppercase text-ink/65">Verified operator</p>
                <h1 className="brush-title text-3xl leading-none text-white">{user.name || "King Goose"}</h1>
                <p className="mt-1 text-xs font-black uppercase text-ember">@{user.handle}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <ProfileNumber label="Wins" value={total.wins} />
                  <ProfileNumber label="Losses" value={total.losses} />
                  <ProfileNumber label="Draws" value={total.draws} />
                </div>
              </div>
              <div className="mt-4">
                <AdminAddUserCard variant="settings" />
              </div>
            </aside>

            <div className="grid content-start gap-3">
              <section className="dark-card p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="brush-strip mb-1 inline-block px-3 py-1 text-[11px] text-parchment">Goose card</p>
                    <h2 className="brush-title text-2xl leading-none text-white">Fun stats, not homework.</h2>
                  </div>
                  <div className="stamp verified-stamp bg-white/50">Verified</div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <ProfileStat icon={Gamepad2} label="Matches" value={total.played.toString()} />
                  <ProfileStat icon={Sparkles} label="Win rate" value={`${winRate}%`} />
                  <ProfileStat icon={Users} label="Rival" value={rival.name} />
                </div>
                <div className="mt-3 rounded-sm border-2 border-black bg-black/35 p-2 text-[11px] font-black uppercase leading-snug text-parchment/75">
                  {rival.detail}
                </div>
              </section>

              <section className="dark-card p-3">
                <div className="section-divider">
                  <span>Game record</span>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-4">
                  <GameRecordCard game={gameLabels.tictac} stats={total} active />
                  {comingSoonStats.map((game) => (
                    <article key={game.game} className="game-library-card game-library-card-locked">
                      <h3 className="text-lg font-black uppercase leading-none text-white">{game.game}</h3>
                      <p className="mt-2 text-xs font-black uppercase text-parchment/55">{game.note}</p>
                      <span className="game-status-soon mt-4">
                        Coming soon
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="dark-card p-3">
                <div className="section-divider">
                  <span>Achievements</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {achievements.map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <article key={achievement.title} className="achievement-card">
                        <div className="flex items-start justify-between gap-3">
                          <Icon className="h-7 w-7 text-signal" />
                          <span className="game-status-soon">Coming soon</span>
                        </div>
                        <h3 className="mt-3 text-base font-black uppercase leading-none text-white">{achievement.title}</h3>
                        <p className="mt-2 text-xs font-black uppercase leading-snug text-parchment/65">{achievement.detail}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function buildStats(outcomes: GameOutcome[], userId: string): Record<GameOutcome["gameKey"], GameStats> {
  const stats: Record<GameOutcome["gameKey"], GameStats> = {
    tictac: { played: 0, wins: 0, losses: 0, draws: 0 }
  };

  for (const outcome of outcomes) {
    const mark = outcome.players.X?.userId === userId ? "X" : "O";
    const game = stats[outcome.gameKey];
    game.played += 1;
    if (outcome.winner === "draw") game.draws += 1;
    else if (outcome.winner === mark) game.wins += 1;
    else game.losses += 1;
  }

  return stats;
}

function findRival(outcomes: GameOutcome[], userId: string, users: Array<{ id: string; name: string; handle: string }>) {
  const counts = new Map<string, number>();
  for (const outcome of outcomes) {
    const opponent = outcome.players.X?.userId === userId ? outcome.players.O?.userId : outcome.players.X?.userId;
    if (!opponent || opponent === "offline-minimax-demo") continue;
    counts.set(opponent, (counts.get(opponent) ?? 0) + 1);
  }
  const [rivalId, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!rivalId) {
    return {
      name: "TBD",
      detail: "Play a few human-verified matches and this will call out the opponent you keep running into."
    };
  }
  const rival = users.find((candidate) => candidate.id === rivalId);
  return {
    name: rival?.name ?? "Mystery Goose",
    detail: `${rival?.name ?? "Mystery Goose"} has faced you ${count} ${count === 1 ? "time" : "times"} in verified play.`
  };
}

function ProfileNumber({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border-2 border-black bg-white/70 px-2 py-2">
      <div className="text-xl font-black leading-none text-ink">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase text-ink/65">{label}</div>
    </div>
  );
}

function ProfileStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="profile-metric-card">
      <Icon className="h-6 w-6 text-signal" />
      <div className="min-w-0">
        <div className="text-[11px] font-black uppercase text-parchment/60">{label}</div>
        <div className="text-2xl font-black uppercase leading-none text-white">{value}</div>
      </div>
    </div>
  );
}

function GameRecordCard({ game, stats, active }: { game: string; stats: GameStats; active?: boolean }) {
  return (
    <article className={`game-record-card ${active ? "game-record-card-active" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <Crown className="h-7 w-7 text-signal" />
        <span className="game-status-ready">{stats.played} played</span>
      </div>
      <h3 className="mt-2 text-lg font-black uppercase leading-none text-white">{game}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniRecord label="W" value={stats.wins} />
        <MiniRecord label="L" value={stats.losses} />
        <MiniRecord label="D" value={stats.draws} />
      </div>
    </article>
  );
}

function MiniRecord({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-white/15 bg-black/35 px-2 py-1.5">
      <div className="text-lg font-black leading-none text-white">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase text-parchment/55">{label}</div>
    </div>
  );
}
