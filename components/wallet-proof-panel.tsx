"use client";

import { useState } from "react";
import { WalletCards } from "lucide-react";
import { StatusBadge } from "@/components/arcade-primitives";
import { useCelebrationBurst } from "@/components/celebration-burst";
import { getPreferredBrowserWallet } from "@/lib/browser-wallet";
import { describeWalletProofError } from "@/lib/wallet-proof-errors";
import type { LinkedWallet } from "@/lib/auth/store";

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletProofPanel({ wallet }: { wallet: LinkedWallet | null }) {
  const [linkedWallet, setLinkedWallet] = useState(wallet);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const { celebrate, celebration } = useCelebrationBurst();

  async function linkWallet() {
    setError(null);
    setStatus(null);

    const wallet = await getPreferredBrowserWallet();
    if (!wallet) {
      setError("No browser wallet was detected. Security Key sign-in still works; for Ledger wallet proof, connect a Ledger account through a browser wallet such as MetaMask.");
      return;
    }

    setIsLinking(true);
    let step = "connecting to the browser wallet";
    try {
      setStatus(`Requesting wallet account from ${wallet.name}...`);
      const accounts = await wallet.provider.request<string[]>({ method: "eth_requestAccounts" });
      const address = accounts[0];
      if (!address) throw new Error("No wallet account was selected.");

      step = "creating the server challenge";
      setStatus("Preparing Wallet Proof challenge...");
      const challengeResponse = await fetch("/api/wallet-proof/challenge", { method: "POST" });
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challenge.error ?? "Could not create Wallet Proof challenge.");

      step = `signing the proof message in ${wallet.name}`;
      setStatus(`Review and sign the Wallet Proof message in ${wallet.name}. Use the Ledger-backed account if prompted.`);
      const signature = await wallet.provider.request<string>({
        method: "personal_sign",
        params: [challenge.message, address]
      });
      if (!signature) throw new Error(`${wallet.name} did not return a signature.`);

      step = "verifying the signed proof";
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
      celebrate("Wallet Proof");
      setStatus("Wallet Proof linked. Security Key remains your primary identity.");
    } catch (linkError) {
      console.error("Wallet Proof link failed", linkError);
      setError(describeWalletProofError(linkError, step));
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
        or make a wallet required for play. The current demo uses MetaMask or another browser wallet as the transport; for the Ledger path, select a Ledger-backed account inside that wallet before signing. Refreshing with a different account replaces the active wallet proof.
      </p>

      <button className="wallet-proof-button" type="button" onClick={linkWallet} disabled={isLinking}>
        <WalletCards className="h-4 w-4" />
        {isLinking ? "Linking Wallet" : linkedWallet ? "Refresh Wallet Proof" : "Add Wallet Proof"}
      </button>

      {status ? <p className="wallet-proof-message">{status}</p> : null}
      {error ? <p className="wallet-proof-error">{error}</p> : null}
      {celebration}
    </div>
  );
}
