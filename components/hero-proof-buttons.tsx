"use client";

import { LockKeyhole, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";

const repoUrl = "https://github.com/Vel-Labs/SillyGoose";

type InfoKey = "hardware" | "dmk";

const infoCopy: Record<InfoKey, { title: string; body: string; cta?: string }> = {
  hardware: {
    title: "Hardware-backed",
    body: "Intended to use a Ledger signer with the Security Key app, so the player action is verified through browser WebAuthn instead of a plain web session."
  },
  dmk: {
    title: "Ledger DMK Demo",
    body: "This demo repo includes local app patterns and agent skills that help teams incorporate open-source repo structure, Ledger DMK readiness, and security-review habits into their own apps.",
    cta: "Open SillyGoose repo"
  }
};

export function HeroProofButtons() {
  const [open, setOpen] = useState<InfoKey | null>(null);
  const activeInfo = open ? infoCopy[open] : null;

  return (
    <div className="hero-proof-wrap">
      <div className="hero-proof-row mt-6 grid grid-cols-3 gap-3">
        <button type="button" onClick={() => setOpen(open === "hardware" ? null : "hardware")} className="hero-proof-button rough-panel">
          <LockKeyhole className="h-4 w-4 shrink-0 text-signal" />
          Hardware-backed
        </button>
        <button type="button" onClick={() => setOpen(open === "dmk" ? null : "dmk")} className="hero-proof-button rough-panel">
          <ShieldCheck className="h-4 w-4 shrink-0 text-signal" />
          Ledger DMK Demo
        </button>
        <div className="hero-proof-button rough-panel">
          <Star className="h-4 w-4 shrink-0 text-signal" />
          Real goose energy
        </div>
      </div>
      {activeInfo ? (
        <div className="hero-proof-detail" role="status">
          <div className="text-[11px] font-black uppercase text-signal">{activeInfo.title}</div>
          <p className="mt-1 text-xs font-black uppercase leading-snug text-parchment/85">{activeInfo.body}</p>
          {activeInfo.cta ? (
            <a href={repoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[11px] font-black uppercase text-signal hover:text-parchment">
              {activeInfo.cta}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
