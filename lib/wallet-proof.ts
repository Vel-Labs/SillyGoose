import { getAddress, verifyMessage } from "ethers";
import { newId, updateStore, type LinkedWallet } from "@/lib/auth/store";

const WALLET_PROOF_TTL_MS = 10 * 60 * 1000;

export type WalletProofChallenge = {
  challengeId: string;
  message: string;
  expiresAt: string;
};

export function getPrimaryLinkedWallet(wallets: LinkedWallet[], userId: string) {
  return wallets
    .filter((wallet) => wallet.userId === userId && wallet.status === "linked")
    .sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt))[0] ?? null;
}

export async function createWalletProofChallenge(user: { id: string; handle: string; name: string }) {
  return updateStore((store): WalletProofChallenge => {
    const now = new Date();
    const challengeId = newId("wallet_challenge");
    const nonce = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + WALLET_PROOF_TTL_MS).toISOString();
    const message = [
      "Silly Goose Entertainment Wallet Proof",
      "",
      "This signature links a wallet to your Human Verified Security Key profile.",
      "It does not replace your Security Key sign-in, authorize a transaction, or move funds.",
      "",
      `Profile: ${user.handle || user.name}`,
      `User ID: ${user.id}`,
      `Challenge ID: ${challengeId}`,
      `Nonce: ${nonce}`,
      `Expires At: ${expiresAt}`
    ].join("\n");

    store.challenges = store.challenges.filter((candidate) => {
      return !(candidate.userId === user.id && candidate.purpose === "wallet-proof");
    });
    store.challenges.push({
      key: challengeId,
      value: message,
      userId: user.id,
      purpose: "wallet-proof",
      createdAt: now.toISOString()
    });
    return { challengeId, message, expiresAt };
  });
}

export async function verifyWalletProof(params: {
  userId: string;
  challengeId: string;
  address: string;
  signature: string;
  chain?: string;
}) {
  const normalizedAddress = getAddress(params.address);

  return updateStore((store) => {
    const challenge = store.challenges.find((candidate) => {
      return candidate.key === params.challengeId && candidate.userId === params.userId && candidate.purpose === "wallet-proof";
    });
    if (!challenge) throw new Error("Wallet proof challenge was not found. Start a new wallet proof request.");

    const createdAt = new Date(challenge.createdAt).getTime();
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > WALLET_PROOF_TTL_MS) {
      store.challenges = store.challenges.filter((candidate) => candidate.key !== params.challengeId);
      throw new Error("Wallet proof challenge expired. Start a new wallet proof request.");
    }

    const recovered = getAddress(verifyMessage(challenge.value, params.signature));
    if (recovered !== normalizedAddress) {
      throw new Error("Wallet signature did not match the requested address.");
    }

    const now = new Date().toISOString();
    const chain = params.chain?.trim() || "eip155:1";
    const existing = store.linkedWallets.find((wallet) => {
      return wallet.userId === params.userId && wallet.chain === chain && wallet.address.toLowerCase() === normalizedAddress.toLowerCase();
    });

    const wallet: LinkedWallet = existing ?? {
      id: newId("wallet"),
      userId: params.userId,
      chain,
      address: normalizedAddress,
      verifiedAt: now,
      lastSignatureChallenge: params.challengeId,
      status: "linked",
      createdAt: now
    };
    wallet.address = normalizedAddress;
    wallet.verifiedAt = now;
    wallet.lastSignatureChallenge = params.challengeId;
    wallet.status = "linked";

    if (!existing) store.linkedWallets.push(wallet);
    for (const candidate of store.linkedWallets) {
      if (candidate.userId === params.userId && candidate.id !== wallet.id && candidate.status === "linked") {
        candidate.status = "revoked";
      }
    }
    store.challenges = store.challenges.filter((candidate) => candidate.key !== params.challengeId);
    return wallet;
  });
}
