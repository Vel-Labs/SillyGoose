"use client";

import { useState } from "react";
import { BellRing, Coins, Swords, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/arcade-primitives";
import type { GrowthLoopSnapshot } from "@/lib/growth-loop";

type EthereumProvider = {
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function GrowthLoopPanel({ initialSnapshot }: { initialSnapshot: GrowthLoopSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function runAction(action: "rivalry" | "bread" | "ping") {
    setError(null);
    setMessage(null);
    setBusy(action);
    try {
      if (action === "rivalry") await createRivalry();
      if (action === "bread") await postBread();
      if (action === "ping") await sendPing();
      location.reload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Growth-loop action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function createRivalry() {
    if (!window.ethereum) throw new Error("A browser wallet is needed to sign the off-chain rivalry challenge. Wallet Proof remains optional for basic play.");
    const preparedResponse = await fetch("/api/growth-loop/rivalry", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const prepared = await preparedResponse.json();
    if (!preparedResponse.ok) throw new Error(prepared.error ?? "Could not prepare signed rivalry.");
    const signature = await window.ethereum.request<string>({
      method: "eth_signTypedData_v4",
      params: [prepared.walletAddress, JSON.stringify({
        domain: prepared.typedData.domain,
        types: prepared.typedData.types,
        primaryType: prepared.typedData.primaryType,
        message: prepared.typedData.message
      })]
    });
    const verifyResponse = await fetch("/api/growth-loop/rivalry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...prepared, rivalUserId: prepared.rival.id, signature })
    });
    const verified = await verifyResponse.json();
    if (!verifyResponse.ok) throw new Error(verified.error ?? "Signed rivalry verification failed.");
    setMessage("Signed rivalry stored off-chain.");
  }

  async function postBread() {
    const response = await fetch("/api/growth-loop/bread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "reward" })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "$Bread update failed.");
    setMessage("$Bread reward posted. Demo value only.");
  }

  async function sendPing() {
    const response = await fetch("/api/growth-loop/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Verified honk. See you in the pond." })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Verified ping failed.");
    setMessage("Verified ping sent.");
  }

  return (
    <div className="growth-loop-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="growth-loop-kicker">Dogfood growth loop</p>
          <h2>Rivals, $Bread, Pings</h2>
        </div>
        <StatusBadge tone="ready">Off-chain</StatusBadge>
      </div>

      <div className="growth-loop-grid">
        <GrowthCard icon={Swords} title="Signed Rivalry" value={`${snapshot.rivalryChallenges.length} signed`} detail={`Rival: ${snapshot.rival.handle}`} />
        <GrowthCard icon={Coins} title="$Bread Ledger" value={`${snapshot.breadBalance} $Bread`} detail="Non-redeemable demo value" />
        <GrowthCard icon={BellRing} title="Verified Pings" value={`${snapshot.verifiedPings.length} sent`} detail="In-app server records" />
        <GrowthCard icon={Trophy} title="Achievements" value={`${snapshot.achievements.filter((item) => item.unlocked).length}/${snapshot.achievements.length}`} detail="Game, social, bread, web3, streak, seasonal, flockerroom" />
      </div>

      <div className="growth-loop-actions">
        <button type="button" onClick={() => runAction("rivalry")} disabled={busy !== null || !snapshot.walletLinked}>
          <Swords className="h-4 w-4" />
          {snapshot.walletLinked ? "Sign Rivalry" : "Wallet Proof Needed"}
        </button>
        <button type="button" onClick={() => runAction("bread")} disabled={busy !== null}>
          <Coins className="h-4 w-4" />
          Post $Bread Reward
        </button>
        <button type="button" onClick={() => runAction("ping")} disabled={busy !== null}>
          <BellRing className="h-4 w-4" />
          Send Verified Ping
        </button>
      </div>

      <div className="growth-achievement-grid">
        {snapshot.achievements.map((achievement) => (
          <div key={achievement.code} className={`growth-achievement ${achievement.unlocked ? "growth-achievement-unlocked" : ""}`}>
            <span>{achievement.category}</span>
            <strong>{achievement.name}</strong>
            <em>{achievement.detail}</em>
          </div>
        ))}
      </div>

      {message ? <p className="growth-loop-message">{message}</p> : null}
      {error ? <p className="growth-loop-error">{error}</p> : null}
    </div>
  );
}

function GrowthCard({ icon: Icon, title, value, detail }: { icon: typeof Swords; title: string; value: string; detail: string }) {
  return (
    <div className="growth-card">
      <Icon className="h-5 w-5" />
      <span>{title}</span>
      <strong>{value}</strong>
      <em>{detail}</em>
    </div>
  );
}
