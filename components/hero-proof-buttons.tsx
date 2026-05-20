"use client";

import { Github, KeyRound, LockKeyhole, Star } from "lucide-react";
import { useState } from "react";

const sillyGooseRepoUrl = "https://github.com/Vel-Labs/SillyGoose";
const ledgerDmkRepoUrl = "https://github.com/LedgerHQ/device-sdk-ts";

type InfoKey = "hardware";

const infoCopy: Record<InfoKey, { title: string; body: string }> = {
  hardware: {
    title: "Hardware-backed",
    body: "Intended to use a Ledger signer with the Security Key app, so the player action is verified through browser WebAuthn instead of a plain web session."
  }
};

export function HeroProofButtons() {
  const [open, setOpen] = useState<InfoKey | null>(null);
  const activeInfo = open ? infoCopy[open] : null;

  return (
    <div className="hero-proof-wrap">
      <div className="hero-proof-row mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <button type="button" onClick={() => setOpen(open === "hardware" ? null : "hardware")} className="hero-proof-button rough-panel">
          <LockKeyhole className="h-4 w-4 shrink-0 text-signal" />
          Hardware-backed
        </button>
        <a href={sillyGooseRepoUrl} target="_blank" rel="noreferrer" className="hero-proof-button rough-panel">
          <Github className="h-4 w-4 shrink-0 text-signal" />
          Open SillyGoose repo
        </a>
        <a href={ledgerDmkRepoUrl} target="_blank" rel="noreferrer" className="hero-proof-button rough-panel">
          <KeyRound className="h-4 w-4 shrink-0 text-signal" />
          Open Ledger DMK repo
        </a>
        <div className="hero-proof-button rough-panel">
          <Star className="h-4 w-4 shrink-0 text-signal" />
          Real goose energy
        </div>
      </div>
      {activeInfo ? (
        <div className="hero-proof-detail" role="status">
          <div className="text-[11px] font-black uppercase text-signal">{activeInfo.title}</div>
          <p className="mt-1 text-xs font-black uppercase leading-snug text-parchment/85">{activeInfo.body}</p>
        </div>
      ) : null}
    </div>
  );
}
