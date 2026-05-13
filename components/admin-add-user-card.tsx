"use client";

import Image from "next/image";
import { Check, Copy, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function AdminAddUserCard() {
  const [status, setStatus] = useState("");

  async function copyReferralLink() {
    const referralLink = `${window.location.origin}/login?ref=friend`;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setStatus("Referral link copied.");
    window.setTimeout(() => setStatus(""), 1800);
  }

  return (
    <section className="poster-border parchment relative flex min-h-[0] flex-col overflow-hidden p-2">
      <Image src="/reference-art/pre-game-countdown.png" alt="" width={1280} height={720} className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-parchment/60" />
      <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-start justify-between gap-3 rounded-sm bg-parchment/90 p-2">
        <div>
          <p className="text-[10px] font-black uppercase text-ink/60">Friend invite</p>
          <h2 className="text-xl font-black uppercase leading-none text-ink">Invite a Friend</h2>
        </div>
        <UserPlus className="h-6 w-6 text-ember" />
      </div>
      <div className="grid items-center gap-2 sm:grid-cols-[72px_1fr]">
        <div className="goose-portrait goose-sprite relative h-20 min-h-0 overflow-hidden" style={{ backgroundPosition: "0% 100%" }} />
        <p className="rounded-sm bg-parchment/90 p-2 text-[11px] font-bold leading-snug text-ink/85">
          Share a referral path so a friend can claim a goose handle and join with their own Security Key session.
        </p>
      </div>
      <div className="mt-auto pt-2">
        <Button onClick={copyReferralLink} variant="danger" className="min-h-9 w-full px-3 py-1.5 text-xs">
          {status ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {status ? "Copied" : "Copy referral link"}
        </Button>
        {status ? <p className="mt-2 rounded-sm bg-gooseblue px-3 py-2 text-xs font-black text-white">{status}</p> : null}
      </div>
      </div>
    </section>
  );
}
