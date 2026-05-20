import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Wallet } from "ethers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
let tempDir: string;

const user = {
  id: "goose-user-1",
  handle: "0xStinky-Goose",
  name: "0xStinky-Goose"
};

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "silly-goose-wallet-proof-"));
  process.chdir(tempDir);
  vi.resetModules();
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(tempDir, { recursive: true, force: true });
  vi.resetModules();
});

describe("wallet proof linking", () => {
  it("keeps one active linked wallet per profile when a new proof is signed", async () => {
    const firstWallet = Wallet.createRandom();
    const secondWallet = Wallet.createRandom();

    const { createWalletProofChallenge, verifyWalletProof, getPrimaryLinkedWallet } = await import("@/lib/wallet-proof");
    const { readStore } = await import("@/lib/auth/store");

    const firstChallenge = await createWalletProofChallenge(user);
    await verifyWalletProof({
      userId: user.id,
      challengeId: firstChallenge.challengeId,
      address: firstWallet.address,
      signature: await firstWallet.signMessage(firstChallenge.message)
    });

    const secondChallenge = await createWalletProofChallenge(user);
    const replacement = await verifyWalletProof({
      userId: user.id,
      challengeId: secondChallenge.challengeId,
      address: secondWallet.address,
      signature: await secondWallet.signMessage(secondChallenge.message)
    });

    const store = await readStore();
    const activeWallets = store.linkedWallets.filter((wallet) => wallet.userId === user.id && wallet.status === "linked");
    const revokedWallets = store.linkedWallets.filter((wallet) => wallet.userId === user.id && wallet.status === "revoked");

    expect(activeWallets).toHaveLength(1);
    expect(activeWallets[0].address).toBe(secondWallet.address);
    expect(revokedWallets).toHaveLength(1);
    expect(revokedWallets[0].address).toBe(firstWallet.address);
    expect(getPrimaryLinkedWallet(store.linkedWallets, user.id)).toMatchObject({
      id: replacement.id,
      address: secondWallet.address,
      status: "linked"
    });
  });
});
