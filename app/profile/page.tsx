import { redirect } from "next/navigation";
import { Crown, Gamepad2, Medal, ShieldCheck, Sparkles, Trophy, Users } from "lucide-react";
import { AchievementCard, ActivityFeed, Panel, RatingBadge, SectionHeader, StatCard, StatusBadge } from "@/components/arcade-primitives";
import { PageShell } from "@/components/brand-shell";
import { GoosePortrait } from "@/components/goose-portrait";
import { getCurrentUser } from "@/lib/auth/session";
import { readStore, type GameOutcome } from "@/lib/auth/store";
import {
  buildGooseProfileStats,
  gameLabels,
  getOperatorClass,
  getOverallRank,
  getRarity,
  getWinRate,
  type GameRecord
} from "@/lib/game-profile";
import { findGoose } from "@/lib/goose-roster";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const store = await readStore();
  const outcomes = store.outcomes.filter((outcome) => {
    return outcome.players.X?.userId === user.id || outcome.players.O?.userId === user.id;
  });
  const preferredGoose = findGoose((outcomes[0]?.players.X?.userId === user.id ? outcomes[0]?.players.X?.goose : outcomes[0]?.players.O?.goose) ?? "captain");
  const stats = buildGooseProfileStats(user, outcomes, preferredGoose.key);
  const rival = findRival(outcomes, user.id, store.users);
  const winRate = getWinRate(stats);
  const operatorClass = getOperatorClass(stats);
  const rarity = getRarity(stats);
  const overallRank = getOverallRank(stats);
  const tictacRecord = stats.gameRecords.find((record) => record.gameId === "ticTacToe")!;
  const gameActivity = outcomes
    .slice()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 4)
    .map((outcome) => formatGameActivity(outcome, user.id));
  const achievementActivity = [
    stats.matchesPlayed > 0 ? "Verified Competitor unlocked by finishing a match." : "Verified Competitor unlocks after one completed match.",
    stats.wins > 0 ? "First Honk logged in the match archive." : "First Honk unlocks after your first win.",
    "Clean Sweep and Pond Regular remain under questionable review."
  ];

  return (
    <PageShell>
      <section className="app-width mx-auto w-full px-4 pb-2 sm:px-6">
        <div className="poster-border dashboard-frame profile-card-frame p-3">
          <Panel className="profile-hero-card p-3">
            <GoosePortrait goose={preferredGoose.key} className="profile-trading-goose selected-goose" priority imageClassName="goose-framed-image" />
            <div className="min-w-0">
              <p className="brush-strip mb-2 inline-block px-3 py-1 text-[11px] text-parchment">Collectible Operator Card</p>
              <h1 className="brush-title text-4xl leading-none text-white xl:text-5xl">{user.name || "King Goose"}</h1>
              <p className="mt-1 text-xs font-black uppercase text-signal">@{user.handle} / Human-Verified</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <RatingBadge label="Active Goose" value={preferredGoose.shortName} />
                <RatingBadge label="Operator Class" value={operatorClass} />
                <RatingBadge label="Rarity" value={rarity} />
                <RatingBadge label="Overall Rank" value={overallRank} />
              </div>
            </div>
            <div className="profile-hero-record">
              <StatusBadge tone="verified">Security Key Profile</StatusBadge>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <ProfileNumber label="Wins" value={stats.wins} />
                <ProfileNumber label="Losses" value={stats.losses} />
                <ProfileNumber label="Draws" value={stats.draws} />
              </div>
              <div className="mt-3 rounded-sm border-2 border-black bg-black/35 p-2 text-[11px] font-black uppercase leading-snug text-parchment/75">
                Main Rival: {rival.name}. {rival.detail}
              </div>
            </div>
          </Panel>

          <div className="profile-middle-row mt-3 grid gap-3 xl:grid-cols-[.7fr_1.3fr]">
            <Panel className="compact-profile-section p-3">
              <SectionHeader>Overall Stats</SectionHeader>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <StatCard icon={Gamepad2} label="Matches" value={stats.matchesPlayed.toString()} detail="Verified match archive" />
                <StatCard icon={Sparkles} label="Win Rate" value={`${winRate}%`} detail="Draws count as pond diplomacy" />
                <StatCard icon={Trophy} label="Honk Rating" value={stats.overallRating.toLocaleString()} detail="Derived from outcomes" />
                <StatCard icon={Users} label="Main Rival" value={rival.name} detail="Frequent verified opponent" />
              </div>
            </Panel>

            <Panel className="compact-profile-section p-3">
              <SectionHeader>Game Ratings</SectionHeader>
              <div className="profile-record-grid mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                <GameRecordCard record={tictacRecord} active />
                {stats.gameRecords.filter((record) => record.gameId !== "ticTacToe").map((record) => (
                  <GameRecordCard key={record.gameId} record={record} />
                ))}
              </div>
            </Panel>
          </div>

          <div className="profile-bottom-row mt-3 grid gap-3 xl:grid-cols-[1fr_.8fr]">
            <Panel className="compact-profile-section scrollable-profile-panel p-3">
              <SectionHeader>Achievements</SectionHeader>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <AchievementCard icon={ShieldCheck} title="Verified Competitor" detail="Finish one verified match without fleeing the pond." unlocked={stats.matchesPlayed > 0} />
                <AchievementCard icon={Medal} title="First Honk" detail="Win a match and make it everybody else's problem." unlocked={stats.wins > 0} />
                <AchievementCard icon={Trophy} title="Pond Regular" detail="Ten matches unlocks a suspiciously official badge." unlocked={stats.matchesPlayed >= 10} />
              </div>
            </Panel>

            <Panel className="compact-profile-section scrollable-profile-panel p-3">
              <SectionHeader>Recent Activity</SectionHeader>
              <div className="profile-activity-columns mt-3">
                <ActivityFeed title="Game Activity" items={gameActivity.length ? gameActivity : ["No completed game outcomes yet."]} />
                <ActivityFeed title="Achievement Activity" items={achievementActivity} />
              </div>
            </Panel>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function formatGameActivity(outcome: GameOutcome, userId: string) {
  const mark = outcome.players.X?.userId === userId ? "X" : "O";
  const result = outcome.winner === "draw" ? "Draw" : outcome.winner === mark ? "Win" : "Loss";
  const date = new Date(outcome.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${gameLabels.ticTacToe} ${result} - ${date}`;
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

function GameRecordCard({ record, active }: { record: GameRecord; active?: boolean }) {
  return (
    <article className={`game-record-card ${active ? "game-record-card-active" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <Crown className="h-7 w-7 text-signal" />
        <StatusBadge tone={active ? "ready" : "soon"}>{active ? `${record.matchesPlayed} played` : "Locked"}</StatusBadge>
      </div>
      <h3 className="mt-2 text-lg font-black uppercase leading-none text-white">{gameLabels[record.gameId]}</h3>
      <p className="mt-1 text-[11px] font-black uppercase text-signal">{record.rating ? `Rating ${record.rating.toLocaleString()}` : "Rating pending"}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniRecord label="W" value={record.wins} />
        <MiniRecord label="L" value={record.losses} />
        <MiniRecord label="D" value={record.draws ?? 0} />
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
