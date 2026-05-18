"use client";

import { useState } from "react";
import { WalletCards } from "lucide-react";
import { StatusBadge } from "@/components/arcade-primitives";
import type { LinkedWallet } from "@/lib/auth/store";

type EthereumProvider = {
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletProofPanel({ wallet }: { wallet: LinkedWallet | null }) {
  const [linkedWallet, setLinkedWallet] = useState(wallet);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  async function linkWallet() {
    setError(null);
    setStatus(null);

    if (!window.ethereum) {
      setError("No browser wallet was detected. Security Key sign-in still works; add a wallet extension only when you want optional Wallet Proof.");
      return;
    }

    setIsLinking(true);
    try {
      setStatus("Requesting wallet account...");
      const accounts = await window.ethereum.request<string[]>({ method: "eth_requestAccounts" });
      const address = accounts[0];
      if (!address) throw new Error("No wallet account was selected.");

      setStatus("Preparing Wallet Proof challenge...");
      const challengeResponse = await fetch("/api/wallet-proof/challenge", { method: "POST" });
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challenge.error ?? "Could not create Wallet Proof challenge.");

      setStatus("Review and sign the Wallet Proof message in your wallet...");
      const signature = await window.ethereum.request<string>({
        method: "personal_sign",
        params: [challenge.message, address]
      });

      setStatus("Verifying Wallet Proof...");
      const verifyResponse = await fetch("/api/wallet-proof/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          address,
          signature,
          chain: "eip155:1"
        })
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verified.error ?? "Wallet Proof verification failed.");

      setLinkedWallet(verified.wallet);
      setStatus("Wallet Proof linked. Security Key remains your primary identity.");
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Wallet Proof was canceled or failed.");
      setStatus(null);
    } finally {
      setIsLinking(false);
    }
  }

  return (
    <div className="wallet-proof-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="wallet-proof-kicker">Optional second proof</p>
          <h2>Wallet Proof</h2>
        </div>
        <StatusBadge tone={linkedWallet ? "verified" : "soon"}>{linkedWallet ? "Linked" : "Optional"}</StatusBadge>
      </div>

      <div className="wallet-proof-status-grid">
        <div>
          <span>Base identity</span>
          <strong>Human Verified</strong>
        </div>
        <div>
          <span>Wallet status</span>
          <strong>{linkedWallet ? formatAddress(linkedWallet.address) : "Not linked"}</strong>
        </div>
      </div>

      <p className="wallet-proof-copy">
        Wallet Proof adds a signed ownership badge to this profile. It does not replace Security Key sign-in, approve a transaction,
        or make a wallet required for play.
      </p>

      <button className="wallet-proof-button" type="button" onClick={linkWallet} disabled={isLinking}>
        <WalletCards className="h-4 w-4" />
        {isLinking ? "Linking Wallet" : linkedWallet ? "Refresh Wallet Proof" : "Add Wallet Proof"}
      </button>

      {status ? <p className="wallet-proof-message">{status}</p> : null}
      {error ? <p className="wallet-proof-error">{error}</p> : null}
    </div>
  );
}
