import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Bot, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoosePortrait } from "./goose-portrait";

export function Panel({ children, className = "", as = "section", id }: { children: ReactNode; className?: string; as?: "article" | "section" | "div"; id?: string }) {
  const Component = as;
  return <Component id={id} className={cn("arcade-panel", className)}>{children}</Component>;
}

export function SectionHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("section-divider", className)}>
      <span>{children}</span>
    </div>
  );
}

export function StatusBadge({ children, tone = "ready", className = "" }: { children: ReactNode; tone?: "ready" | "soon" | "danger" | "verified"; className?: string }) {
  return <span className={cn("status-badge", `status-badge-${tone}`, className)}>{children}</span>;
}

export function StatCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail?: string }) {
  return (
    <div className="profile-metric-card">
      <Icon className="h-6 w-6 text-signal" />
      <div className="min-w-0">
        <div className="text-[11px] font-black uppercase text-parchment/60">{label}</div>
        <div className="text-2xl font-black uppercase leading-none text-white">{value}</div>
        {detail ? <div className="mt-1 text-[10px] font-black uppercase leading-tight text-parchment/50">{detail}</div> : null}
      </div>
    </div>
  );
}

export function ActivityFeed({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="profile-activity-panel">
      <h3>{title}</h3>
      <div className="mt-2 grid gap-1.5">
        {items.slice(0, 4).map((item, index) => (
          <div key={`${title}-${index}-${item}`} className="profile-activity-row">{item}</div>
        ))}
      </div>
    </div>
  );
}

export function AchievementCard({ icon: Icon, title, detail, unlocked = false }: { icon: LucideIcon; title: string; detail: string; unlocked?: boolean }) {
  return (
    <article className={cn("achievement-card", unlocked ? "achievement-card-unlocked" : "")}>
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-7 w-7 text-signal" />
        <StatusBadge tone={unlocked ? "verified" : "soon"}>{unlocked ? "Unlocked" : "Coming soon"}</StatusBadge>
      </div>
      <h3 className="mt-3 text-base font-black uppercase leading-none text-white">{title}</h3>
      <p className="mt-2 text-xs font-black uppercase leading-snug text-parchment/65">{detail}</p>
    </article>
  );
}

export function RatingBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rating-badge">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function MysteryGooseCard({ mode = "pending" }: { mode?: "pending" | "ai" }) {
  const aiMode = mode === "ai";
  return (
    <div className="mystery-goose-card verified-badge verified-badge-featured badge-blue">
      <div className={aiMode ? "mystery-goose-portrait mystery-goose-portrait-online" : "mystery-goose-portrait"}>
        <GoosePortrait goose="ai" alt={aiMode ? "AI Goose opponent" : "Mystery rival goose silhouette"} className="min-h-[118px]" />
        <div className={aiMode ? "mystery-goose-lock mystery-goose-lock-online" : "mystery-goose-lock"}>
          {aiMode ? <Bot className="h-8 w-8" /> : <LockKeyhole className="h-8 w-8" />}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-black uppercase text-parchment/65">Player Two</div>
        <div className="brush-title text-xl text-white">{aiMode ? "AI Goose Online" : "Mystery Goose Pending"}</div>
        <div className="mt-1 text-[11px] font-black uppercase text-parchment/70">{aiMode ? "Suspicious pond algorithm" : "Awaiting Rival Goose"}</div>
        <div className="mt-2 text-xs font-black uppercase text-signal">{aiMode ? "Honk rating: synthetic" : "Honk rating: locked"}</div>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs font-black uppercase text-parchment">
          <LockKeyhole className="h-4 w-4 text-signal" />
          {aiMode ? "Offline AI controls O" : "Waiting for Security Key"}
        </div>
      </div>
    </div>
  );
}
