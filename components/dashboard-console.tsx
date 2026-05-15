"use client";

import Image from "next/image";
import { Anchor, Coins, Eye, Gamepad2, Grid2X2, LockKeyhole, Medal, Radar, ShieldCheck, ShipWheel, Sparkles, Swords, Trophy, Users, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel, SectionHeader } from "@/components/arcade-primitives";
import { GameLibrary } from "@/components/game-library";
import { GamePrepCard } from "@/components/game-prep-card";
import { GoosePortrait } from "@/components/goose-portrait";
import { OperatorGooseProfile } from "@/components/operator-goose-profile";
import { SurrenderHonkButton } from "@/components/surrender-honk-button";
import { Button } from "@/components/ui/button";
import type { DemoUser, GameOutcome } from "@/lib/auth/store";
import { findGoose, type GooseKey } from "@/lib/goose-roster";

type DashboardTab = "overview" | "builder" | "games";

type DashboardConsoleProps = {
  user: DemoUser;
  outcomes: GameOutcome[];
  initialTab?: DashboardTab;
};

const tabs = [
  {
    key: "overview",
    label: "Overview",
    detail: "Flock status",
    icon: ShieldCheck
  },
  {
    key: "builder",
    label: "Goose Builder",
    detail: "Pick your operator",
    icon: Sparkles
  },
  {
    key: "games",
    label: "Games",
    detail: "Play or preview modes",
    icon: Gamepad2
  }
] satisfies Array<{
  key: DashboardTab;
  label: string;
  detail: string;
  icon: LucideIcon;
}>;

export function DashboardConsole({ user, outcomes, initialTab = "overview" }: DashboardConsoleProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const activeTabLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? "Overview";

  return (
    <section className="app-width mx-auto w-full px-4 pb-2 sm:px-6">
      <div className="poster-border dashboard-frame dashboard-console-frame grid gap-3 p-3 lg:grid-cols-[230px_1fr]">
        <aside className="dashboard-command-rail dark-card">
          <OperatorGooseProfile operatorName={user.name || "King Goose"} />

          <div className="grid gap-2">
            <div className="sidebar-row sidebar-row-active">
              <ShieldCheck className="h-4 w-4" />
              Security Key session
            </div>
            <div className="sidebar-row">
              <LockKeyhole className="h-4 w-4" />
              WebAuthn verified
            </div>
            <div className="sidebar-row">
              <Coins className="h-4 w-4" />
              1,337 honks
            </div>
          </div>

          <SectionHeader className="dashboard-rail-divider">Actions</SectionHeader>

          <nav className="grid gap-2" aria-label="Dashboard sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`dashboard-tab-button ${active ? "dashboard-tab-button-active" : ""}`}
                  aria-pressed={active}
                >
                  <Icon className="h-5 w-5" />
                  <span>
                    <strong>{tab.label}</strong>
                    <small>{tab.detail}</small>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <SurrenderHonkButton />
          </div>
        </aside>

        <div className="dashboard-main-grid min-h-0">
          <header className="dashboard-status-card poster-border parchment">
            <Image src="/reference-art/game-loading-screen-empty.png" alt="" width={1672} height={941} priority className="absolute inset-0 h-full w-full object-cover opacity-20" />
            <div className="relative grid h-full min-h-0 items-center gap-3 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase text-ink/60">Welcome back</p>
                <h1 className="brush-title dashboard-title text-white">{user.name || "Verified Goose"}.</h1>
                <p className="truncate text-xs font-black uppercase text-ember">@{user.handle} retained by Security Key session</p>
              </div>
              <div className="dashboard-mode-badge">
                <span>Showing</span>
                <strong>{activeTabLabel}</strong>
              </div>
            </div>
          </header>

          <main className="dashboard-panel-wrap min-h-0">
            {activeTab === "overview" ? <DashboardOverview outcomes={outcomes} userId={user.id} onChangeGoose={() => setActiveTab("builder")} /> : null}

            {activeTab === "builder" ? <GamePrepCard defaultGoose="captain" /> : null}

            {activeTab === "games" ? <GameLibrary /> : null}
          </main>
        </div>
      </div>
    </section>
  );
}

type OverviewGame = {
  title: string;
  status: string;
  icon: LucideIcon;
  available?: boolean;
};

const overviewGames: OverviewGame[] = [
  { title: "Tic-Tac-Toe", status: "Playable", icon: Grid2X2, available: true },
  { title: "Battleship", status: "Coming soon", icon: ShipWheel },
  { title: "Connect 4", status: "Coming soon", icon: Swords },
  { title: "Pond Racers", status: "Coming soon", icon: Anchor },
  { title: "Honk Memory", status: "Coming soon", icon: Radar }
];

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function DashboardOverview({ outcomes, userId, onChangeGoose }: { outcomes: GameOutcome[]; userId: string; onChangeGoose: () => void }) {
  const [gooseKey, setGooseKey] = useState<GooseKey>("captain");
  const [flockCode, setFlockCode] = useState("");
  const [expandedGame, setExpandedGame] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const goose = findGoose(gooseKey);

  useEffect(() => {
    const syncPreferredGoose = () => {
      const stored = window.localStorage.getItem("silly-goose.preferred-goose") as GooseKey | null;
      setGooseKey(stored ? findGoose(stored).key : "captain");
    };
    const onPreferredGoose = (event: Event) => {
      const nextGoose = (event as CustomEvent<{ goose?: GooseKey }>).detail?.goose;
      setGooseKey(findGoose(nextGoose).key);
    };

    syncPreferredGoose();
    window.addEventListener("storage", syncPreferredGoose);
    window.addEventListener("silly-goose:preferred-goose", onPreferredGoose);
    return () => {
      window.removeEventListener("storage", syncPreferredGoose);
      window.removeEventListener("silly-goose:preferred-goose", onPreferredGoose);
    };
  }, []);

  async function openTicTacToe() {
    setStatus("Opening human-verified Tic-Tac-Toe lobby...");
    setError("");
    try {
      const data = await postJson("/api/game/room", { aiMode: false, goose: gooseKey });
      window.location.href = `/game/${data.room.id}`;
    } catch (roomError) {
      setStatus("");
      setError(roomError instanceof Error ? roomError.message : "Could not open Tic-Tac-Toe.");
    }
  }

  function normalizedFlockCode() {
    const trimmed = flockCode.trim();
    if (!trimmed) {
      setError("Enter a Flock Code first.");
      return null;
    }
    return trimmed.toLowerCase().startsWith("tictac_") ? trimmed : `tictac_${trimmed.toUpperCase()}`;
  }

  function joinGame() {
    setStatus("");
    setError("");
    const roomId = normalizedFlockCode();
    if (!roomId) return;
    window.location.href = `/join/${roomId}`;
  }

  function spectateGame() {
    setStatus("");
    setError("");
    const roomId = normalizedFlockCode();
    if (!roomId) return;
    window.location.href = `/game/${roomId}`;
  }

  return (
    <section className="dashboard-overview-grid">
      <Panel as="article" className="dashboard-overview-goose">
        <SectionHeader>Active Goose</SectionHeader>
        <GoosePortrait goose={goose.key} className="selected-goose dashboard-overview-goose-portrait mt-3" priority imageClassName="goose-framed-image" />
        <div className="selected-operator-panel mt-3">
          <div className="text-[11px] font-black uppercase text-ink/65">Human-verified active goose</div>
          <div className="text-xl font-black uppercase leading-none text-ink">{goose.shortName}</div>
          <div className="mt-1 text-[11px] font-black uppercase text-ink/70">Honk rating: {goose.rating.toLocaleString()}</div>
          <div className="mt-1 text-xs font-black uppercase text-ember">{goose.role}</div>
          <div className="mt-2 text-xs font-black uppercase leading-snug text-ink/70">{goose.catchphrase}</div>
          <div className="mt-2 rounded-sm bg-white/65 p-2 text-xs font-black leading-snug text-ink/75">{goose.quote}</div>
          <div className="mt-2 grid gap-1.5">
            {goose.stats.map((stat) => (
              <div key={stat.label} className="goose-stat-row">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={onChangeGoose} className="mt-3 min-h-9 w-full px-3 py-1.5 text-xs">
            Change goose
          </Button>
        </div>
      </Panel>

      <Panel as="article" className="dashboard-overview-games">
        <SectionHeader>Play Next</SectionHeader>
        <div className="mt-3 grid gap-3">
          {overviewGames.map((game) => {
            const Icon = game.icon;
            const expanded = expandedGame === game.title;
            return (
              <div key={game.title} className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedGame(expanded ? "" : game.title)}
                  className={`wood-game-box ${game.available ? "wood-game-box-live" : "wood-game-box-locked"} ${expanded ? "wood-game-box-active" : ""}`}
                  aria-expanded={expanded}
                >
                  <Icon className="h-5 w-5" />
                  <span>{game.title}</span>
                  <strong>{game.status}</strong>
                </button>
                {expanded && game.available ? (
                  <div className="game-launch-panel game-launch-panel-primary">
                    <div>
                      <p className="text-[11px] font-black uppercase text-signal">Next Verified Match</p>
                      <h3 className="brush-title mt-1 text-2xl leading-none text-white">Ready for the Pond.</h3>
                      <p className="mt-2 whitespace-nowrap text-[11px] font-black uppercase leading-none text-parchment/70">Start or Join a Flock, or Spectate the Pond.</p>
                    </div>
                    <div className="game-action-grid mt-2">
                      <Button type="button" onClick={() => openTicTacToe()} title="Open a fresh verified room." className="min-h-10 px-3 py-2 text-xs">
                        <Users className="h-4 w-4" />
                        Start
                      </Button>
                      <Button type="button" variant="secondary" onClick={joinGame} title="Enter a Flock Code and bring your own goose." className="min-h-10 px-3 py-2 text-xs">
                        <LockKeyhole className="h-4 w-4" />
                        Join
                      </Button>
                      <Button type="button" variant="ghost" onClick={spectateGame} title="Watch the pond without touching the board." className="min-h-10 px-3 py-2 text-xs">
                        <Eye className="h-4 w-4" />
                        Spectate
                      </Button>
                    </div>
                    <label className="mt-2 grid gap-1 text-[10px] font-black uppercase text-parchment/62">
                      Flock Code for Join / Spectate
                      <input
                        value={flockCode}
                        onChange={(event) => setFlockCode(event.target.value)}
                        placeholder="TICTAC_F433"
                        className="flock-code-input"
                      />
                    </label>
                  </div>
                ) : null}
                {expanded && !game.available ? (
                  <div className="game-launch-panel">
                    <p className="text-[11px] font-black uppercase text-signal">{game.title} is still in pond review.</p>
                    <p className="mt-1 text-[11px] font-black uppercase leading-snug text-parchment/60">This flock is assembling paperwork, snacks, and legally questionable confidence.</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {status ? <p className="mt-3 rounded-sm bg-gooseblue px-3 py-2 text-xs font-black uppercase text-white">{status}</p> : null}
        {error ? <p className="mt-3 rounded-sm bg-ember px-3 py-2 text-xs font-black uppercase text-white">{error}</p> : null}
      </Panel>

      <Panel as="article" className="dashboard-overview-activity">
        <SectionHeader>Recent Activity</SectionHeader>
        <div className="mt-3 grid gap-2">
          {outcomes.length ? outcomes.map((outcome) => (
            <OutcomeRow key={outcome.id} outcome={outcome} userId={userId} />
          )) : (
            <div className="activity-row">
              <Gamepad2 className="h-5 w-5 text-signal" />
              <span>No completed game outcomes yet.</span>
            </div>
          )}
          <div className="activity-row activity-row-muted">
            <Medal className="h-5 w-5 text-signal" />
            <span>Achievement builder coming soon.</span>
            <strong>Coming soon</strong>
          </div>
        </div>
      </Panel>
    </section>
  );
}

function OutcomeRow({ outcome, userId }: { outcome: GameOutcome; userId: string }) {
  const mark = outcome.players.X?.userId === userId ? "X" : "O";
  const result = outcome.winner === "draw" ? "Draw" : outcome.winner === mark ? "Win" : "Loss";
  const Icon = result === "Win" ? Trophy : result === "Draw" ? ShieldCheck : Gamepad2;
  const date = new Date(outcome.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="activity-row">
      <Icon className="h-5 w-5 text-signal" />
      <span>Tic-Tac-Toe {result}</span>
      <strong>{date}</strong>
    </div>
  );
}
