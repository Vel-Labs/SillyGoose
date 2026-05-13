"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import Image from "next/image";
import { CheckCircle2, KeyRound, ShieldCheck, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

async function postJson(path: string, body: unknown = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export function AdminAddUserCard() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);

  async function approve() {
    setError("");
    setStatus("Fresh verification required. Approve the Security Key prompt.");
    try {
      const options = await postJson("/api/admin/add-user/challenge");
      const response = await startAuthentication({ optionsJSON: options });
      await postJson("/api/admin/add-user/verify", { response });
      setApproved(true);
      setStatus("Intern Goose added after fresh Security Key approval.");
    } catch (approvalError) {
      setStatus("");
      setError(approvalError instanceof Error ? approvalError.message : "Approval canceled or failed.");
    }
  }

  async function demoApprove() {
    await postJson("/api/admin/add-user/verify", { demoFallback: true });
    setApproved(true);
    setStatus("Demo fallback approval recorded. This is not production authorization.");
  }

  return (
    <section className="poster-border parchment relative overflow-hidden p-4">
      <Image src="/reference-art/pre-game-countdown.png" alt="" width={1280} height={720} className="absolute inset-0 h-full w-full object-cover opacity-20" />
      <div className="relative">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-ink/60">Admin actions</p>
          <h2 className="brush-title text-2xl text-ink [text-shadow:2px_2px_0_#f4a51c] xl:text-3xl">Add Intern Goose</h2>
        </div>
        <UserPlus className="h-10 w-10 text-ember" />
      </div>
      <div className="mb-3 grid items-center gap-3 sm:grid-cols-[80px_1fr]">
        <div className="goose-portrait goose-sprite relative h-[88px] overflow-hidden" style={{ backgroundPosition: "0% 100%" }} />
        <p className="text-sm font-bold leading-snug text-ink/75">
          Bring fresh talent into the flock. This action requires a new hardware-backed confirmation separate from login.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button onClick={approve} variant="danger">
          <KeyRound className="h-4 w-4" /> Confirm admin action
        </Button>
        <Button onClick={demoApprove} variant="ghost" className="border-black bg-black text-parchment">
          Marked fallback
        </Button>
      </div>
      {approved ? <div className="stamp mt-5 inline-block bg-white/40 px-4 py-2 text-xl">Verified</div> : null}
      {status ? <p className="mt-4 rounded-sm bg-gooseblue px-3 py-2 text-sm font-black text-white">{status}</p> : null}
      {error ? <p className="mt-4 rounded-sm bg-ember px-3 py-2 text-sm font-black text-white">{error}</p> : null}
      <div className="mt-3 rounded-sm border-4 border-black bg-ink p-2 text-center text-parchment shadow-poster">
        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-signal">
          <span>Fresh verification required</span>
          <X className="h-4 w-4 text-ember" />
        </div>
        <ShieldCheck className="mx-auto h-7 w-7 text-green-400" />
        <p className="mt-1 text-xs font-bold leading-snug text-parchment/75">
          Insert your Ledger Security Key and tap to confirm.
        </p>
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: 7 }).map((_, index) => (
            <CheckCircle2 key={index} className="h-3 w-3 text-green-400" />
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
