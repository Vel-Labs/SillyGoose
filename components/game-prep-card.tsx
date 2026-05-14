"use client";

import {
  BriefcaseBusiness,
  CheckCircle2,
  Crown,
  Glasses,
  Landmark,
  Shield,
  Sparkles,
  Swords,
  Utensils,
  Zap,
  type LucideIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { Panel, SectionHeader } from "@/components/arcade-primitives";
import { findGoose, gooseRoster, type GooseKey } from "@/lib/goose-roster";
import { GoosePortrait } from "./goose-portrait";
import { Button } from "./ui/button";

type GamePrepCardProps = {
  defaultGoose?: GooseKey;
};

const gooseIcons: Record<GooseKey, LucideIcon> = {
  afro: Glasses,
  jefe: Crown,
  sword: Swords,
  punk: Zap,
  beanie: BriefcaseBusiness,
  duke: Landmark,
  captain: Shield,
  spoon: Utensils,
  ai: Sparkles
};

export function GamePrepCard({ defaultGoose = "captain" }: GamePrepCardProps) {
  const [selected, setSelected] = useState<GooseKey>(defaultGoose);
  const [lockedGoose, setLockedGoose] = useState<GooseKey>(defaultGoose);
  const [status, setStatus] = useState("");
  const activeGoose = findGoose(selected);
  const isLocked = lockedGoose === selected;

  useEffect(() => {
    const stored = window.localStorage.getItem("silly-goose.preferred-goose") as GooseKey | null;
    const preferred = stored ? findGoose(stored).key : defaultGoose;
    setSelected(preferred);
    setLockedGoose(preferred);
  }, [defaultGoose]);

  function selectGoose(goose: GooseKey) {
    setSelected(goose);
    setStatus("");
  }

  function lockGoose() {
    window.localStorage.setItem("silly-goose.preferred-goose", selected);
    setLockedGoose(selected);
    setStatus(`${activeGoose.shortName} is now your Active Goose.`);
    window.dispatchEvent(new CustomEvent("silly-goose:preferred-goose", { detail: { goose: selected } }));
  }

  return (
    <Panel className="poster-border p-2">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <p className="brush-strip mb-1 inline-block px-3 py-1 text-[11px] text-parchment">Goose Builder</p>
          <h2 className="brush-title text-lg text-white xl:text-xl">Choose your Active Goose.</h2>
        </div>
        <Sparkles className="h-6 w-6 text-signal" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(180px,230px)_minmax(170px,240px)_minmax(210px,1fr)]">
        <div>
          <SectionHeader>Choose Your Goose</SectionHeader>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {gooseRoster.filter((goose) => goose.key !== "ai").map((goose) => {
              const GooseIcon = gooseIcons[goose.key];
              return (
                <button
                  key={goose.key}
                  type="button"
                  onClick={() => selectGoose(goose.key)}
                  className={`goose-token ${selected === goose.key ? "goose-token-active" : ""} ${lockedGoose === goose.key ? "goose-token-locked" : ""}`}
                  aria-label={`Select ${goose.name}`}
                  aria-pressed={selected === goose.key}
                >
                  <span className="goose-token-icon">
                    <GooseIcon className="h-7 w-7" />
                  </span>
                  <span className="goose-token-name">{goose.shortName}</span>
                  {lockedGoose === goose.key ? <CheckCircle2 className="goose-token-check h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        </div>
        <GoosePortrait goose={activeGoose.key} className="selected-goose min-h-[220px] animate-goose-pop lg:h-full" priority imageClassName="goose-framed-image" />
        <div className="grid min-h-0 content-start gap-2">
          <div className="selected-operator-panel">
            <div className="text-[11px] font-black uppercase text-ink/65">{isLocked ? "Active Goose" : "Preview Goose"}</div>
            <div className="text-xl font-black uppercase leading-none text-ink">{activeGoose.shortName}</div>
            <div className="text-xs font-black uppercase text-ember">Honk rating: {activeGoose.rating.toLocaleString()}</div>
            <div className="text-xs font-black uppercase text-ink">{activeGoose.role}</div>
            <div className="mt-2 text-xs font-black uppercase leading-snug text-ink/70">{activeGoose.catchphrase}</div>
            <div className="mt-2 rounded-sm bg-white/65 p-2 text-xs font-black leading-snug text-ink/75">{activeGoose.quote}</div>
            <div className="mt-2 grid gap-1.5">
              {activeGoose.stats.map((stat) => (
                <div key={stat.label} className="goose-stat-row">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={lockGoose} variant={isLocked ? "ghost" : "danger"} className={`min-h-9 w-full px-2 text-xs ${isLocked ? "preferred-goose-locked" : ""}`}>
            <CheckCircle2 className="h-4 w-4" /> {isLocked ? "Active Goose Locked" : "Set Active Goose"}
          </Button>
          {status ? <p className="mt-3 rounded-sm bg-gooseblue px-3 py-2 text-xs font-black uppercase text-white">{status}</p> : null}
        </div>
      </div>
    </Panel>
  );
}
