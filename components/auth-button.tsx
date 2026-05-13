"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getLedgerReadiness, prepareLedgerSecurityKeyApp, type LedgerReadiness } from "@/lib/auth/ledger-dmk";
import { Button } from "./ui/button";

type AuthButtonProps = {
  mode?: "login" | "register";
  redirectTo?: string;
};

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

export function AuthButton({ mode = "login", redirectTo = "/dashboard" }: AuthButtonProps) {
  const router = useRouter();
  const [handle, setHandle] = useState("captain-goose");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [prepared, setPrepared] = useState(false);
  const [readiness, setReadiness] = useState<LedgerReadiness>({
    available: false,
    status: "deferred",
    message: "Checking Ledger DMK readiness..."
  });

  useEffect(() => {
    setReadiness(getLedgerReadiness());
  }, []);

  async function prepareLedger() {
    setError("");
    setStatus("Preparing your Ledger Security Key...");
    const result = await prepareLedgerSecurityKeyApp(setStatus);
    setPrepared(result.ok);
    setStatus(result.message);
    return result.ok;
  }

  async function runAuth(nextMode = mode) {
    setError("");
    setStatus("Preparing Ledger Security Key app...");
    try {
      if (!prepared && readiness.available) {
        await prepareLedger();
      }
      setStatus(nextMode === "register" ? "Preparing registration challenge..." : "Preparing login challenge...");
      if (nextMode === "register") {
        const options = await postJson("/api/webauthn/register/options", { handle });
        setStatus("Insert or unlock your Ledger Security Key, then approve the browser prompt.");
        const response = await startRegistration({ optionsJSON: options });
        await postJson("/api/webauthn/register/verify", { handle, response });
      } else {
        const options = await postJson("/api/webauthn/login/options", { handle });
        setStatus("Approve the browser WebAuthn prompt with your Security Key.");
        const response = await startAuthentication({ optionsJSON: options });
        await postJson("/api/webauthn/login/verify", { handle, response });
      }
      setStatus("Verified. Opening the requested goose room...");
      router.push(redirectTo);
      router.refresh();
    } catch (authError) {
      setStatus("");
      setError(authError instanceof Error ? authError.message : "WebAuthn was canceled or failed.");
    }
  }

  async function enterDemoMode() {
    setError("");
    setStatus("Opening visibly marked demo fallback mode...");
    await postJson("/api/webauthn/demo-session", { handle });
    router.push(redirectTo === "/dashboard" ? "/dashboard?demo=fallback" : redirectTo);
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-black uppercase text-ink/70" htmlFor="goose-handle">
        Goose handle
      </label>
      <input
        id="goose-handle"
        className="w-full rounded-sm border-2 border-black bg-white/80 px-3 py-2.5 text-base font-black text-ink outline-none focus:ring-4 focus:ring-signal/40"
        value={handle}
        onChange={(event) => setHandle(event.target.value)}
      />
      <Button onClick={prepareLedger} variant="secondary" className="w-full">
        <ShieldCheck className="h-4 w-4" /> Prepare Ledger Security Key app
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button onClick={() => runAuth("login")} className="w-full">
          <KeyRound className="h-4 w-4" /> Sign in
        </Button>
        <Button onClick={() => runAuth("register")} variant="danger" className="w-full">
          <ShieldCheck className="h-4 w-4" /> Register
        </Button>
      </div>
      <Button onClick={enterDemoMode} variant="ghost" className="w-full border-black bg-black/80 text-parchment">
        Local fallback
      </Button>
      <div className="rounded-sm border-2 border-black bg-black/85 p-2 text-[11px] font-bold leading-tight text-parchment">
        <div className="mb-1 flex items-center gap-2 text-signal">
          <ShieldAlert className="h-4 w-4" /> Ledger DMK readiness
        </div>
        <p>{readiness.message}</p>
        <p className="mt-1 text-parchment/75">
          This does not open the desktop Ledger Wallet app. Install the Security Key app there first if it is missing.
        </p>
      </div>
      {status ? <p className="rounded-sm bg-gooseblue px-3 py-2 text-sm font-black text-white">{status}</p> : null}
      {error ? <p className="rounded-sm bg-ember px-3 py-2 text-sm font-black text-white">{error}</p> : null}
    </div>
  );
}
