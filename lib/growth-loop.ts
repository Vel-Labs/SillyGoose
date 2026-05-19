import { getAddress, verifyTypedData } from "ethers";
import { getPrimaryLinkedWallet } from "@/lib/wallet-proof";
import {
  newId,
  readStore,
  updateStore,
  type BreadTransaction,
  type DemoUser,
  type SignedRivalryChallenge,
  type VerifiedPing
} from "@/lib/auth/store";

const CHALLENGE_TTL_MS = 24 * 60 * 60 * 1000;

export type GrowthLoopSnapshot = {
  walletLinked: boolean;
  rival: { id: string; name: string; handle: string };
  breadBalance: number;
  breadTransactions: BreadTransaction[];
  rivalryChallenges: SignedRivalryChallenge[];
  verifiedPings: VerifiedPing[];
  achievements: Array<{ code: string; name: string; category: string; unlocked: boolean; detail: string }>;
};

export async function getGrowthLoopSnapshot(user: DemoUser): Promise<GrowthLoopSnapshot> {
  const store = await readStore();
  const rival = findOrCreateReadableRival(store.users, user.id);
  const wallet = getPrimaryLinkedWallet(store.linkedWallets ?? [], user.id);
  const transactions = (store.breadTransactions ?? []).filter((transaction) => transaction.userId === user.id);
  const rivalryChallenges = (store.rivalryChallenges ?? []).filter((challenge) => challenge.challengerUserId === user.id || challenge.rivalUserId === user.id);
  const verifiedPings = (store.verifiedPings ?? []).filter((ping) => ping.fromUserId === user.id || ping.toUserId === user.id);
  const breadBalance = transactions.reduce((total, transaction) => total + transaction.amount, 0);
  return {
    walletLinked: Boolean(wallet),
    rival,
    breadBalance,
    breadTransactions: transactions.slice(0, 5),
    rivalryChallenges: rivalryChallenges.slice(0, 5),
    verifiedPings: verifiedPings.slice(0, 5),
    achievements: buildAchievementList({
      matchesPlayed: store.outcomes.filter((outcome) => outcome.players.X?.userId === user.id || outcome.players.O?.userId === user.id).length,
      walletLinked: Boolean(wallet),
      hasRivalry: rivalryChallenges.length > 0,
      hasBread: transactions.length > 0,
      hasPing: verifiedPings.length > 0
    })
  };
}

export async function prepareRivalryTypedData(user: DemoUser) {
  const store = await readStore();
  const wallet = getPrimaryLinkedWallet(store.linkedWallets ?? [], user.id);
  if (!wallet) throw new Error("Add Wallet Proof before signing a rivalry challenge.");
  const rival = findOrCreateReadableRival(store.users, user.id);
  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
  const typedData = {
    domain: {
      name: "Silly Goose Entertainment",
      version: "1",
      chainId: 1,
      verifyingContract: "0x0000000000000000000000000000000000000000"
    },
    types: {
      RivalryChallenge: [
        { name: "challenger", type: "string" },
        { name: "rival", type: "string" },
        { name: "gameKey", type: "string" },
        { name: "nonce", type: "string" },
        { name: "expiresAt", type: "string" },
        { name: "memo", type: "string" }
      ]
    },
    primaryType: "RivalryChallenge",
    message: {
      challenger: user.handle,
      rival: rival.handle,
      gameKey: "tictac",
      nonce,
      expiresAt,
      memo: "Off-chain signed rivalry. No gas, no funds, no chain write."
    }
  };
  return { typedData, nonce, expiresAt, linkedWalletId: wallet.id, walletAddress: wallet.address, rival };
}

export async function recordSignedRivalry(user: DemoUser, params: { typedData: any; nonce: string; expiresAt: string; linkedWalletId: string; walletAddress: string; rivalUserId: string; signature: string }) {
  const recovered = getAddress(verifyTypedData(params.typedData.domain, params.typedData.types, params.typedData.message, params.signature));
  const walletAddress = getAddress(params.walletAddress);
  if (recovered !== walletAddress) throw new Error("Signed rivalry signature did not match the linked wallet.");

  return updateStore((store) => {
    const wallet = store.linkedWallets.find((candidate) => candidate.id === params.linkedWalletId && candidate.userId === user.id && candidate.status === "linked");
    if (!wallet) throw new Error("Linked wallet proof was not found for this profile.");
    const challenge: SignedRivalryChallenge = {
      id: newId("rivalry"),
      nonce: params.nonce,
      challengerUserId: user.id,
      rivalUserId: params.rivalUserId,
      gameKey: "tictac",
      linkedWalletId: wallet.id,
      walletAddress,
      signature: params.signature,
      typedData: params.typedData,
      status: "signed",
      expiresAt: params.expiresAt,
      createdAt: new Date().toISOString()
    };
    store.rivalryChallenges.unshift(challenge);
    return challenge;
  });
}

export async function postBreadReward(user: DemoUser, kind: BreadTransaction["kind"] = "reward") {
  return updateStore((store) => {
    const rival = findOrCreateReadableRival(store.users, user.id);
    const amount = kind === "gg_tip" || kind === "stake_lock" ? -5 : 25;
    const transaction: BreadTransaction = {
      id: newId("bread"),
      userId: user.id,
      counterpartyUserId: rival.id,
      amount,
      kind,
      status: kind === "stake_lock" ? "locked" : "posted",
      memo: kind === "gg_tip" ? "GG tip. Demo value only; not redeemable." : kind === "stake_lock" ? "Challenge stake lock. Demo value only." : "Verified play reward. Demo value only.",
      createdAt: new Date().toISOString()
    };
    store.breadTransactions.unshift(transaction);
    return transaction;
  });
}

export async function sendVerifiedPing(user: DemoUser, message = "Verified honk. See you in the pond.") {
  return updateStore((store) => {
    const rival = findOrCreateReadableRival(store.users, user.id);
    const ping: VerifiedPing = {
      id: newId("ping"),
      fromUserId: user.id,
      toUserId: rival.id,
      message,
      channel: "in_app",
      status: "sent",
      createdAt: new Date().toISOString()
    };
    store.verifiedPings.unshift(ping);
    return ping;
  });
}

function findOrCreateReadableRival(users: DemoUser[], userId: string) {
  const rival = users.find((candidate) => candidate.id !== userId && candidate.id !== "offline-minimax-demo");
  return rival ?? { id: "offline-minimax-demo", name: "AI Goose", handle: "0xAI-Goose", createdAt: new Date().toISOString(), credentials: [] };
}

function buildAchievementList(flags: { matchesPlayed: number; walletLinked: boolean; hasRivalry: boolean; hasBread: boolean; hasPing: boolean }) {
  return [
    { code: "verified-competitor", name: "Verified Competitor", category: "game", unlocked: flags.matchesPlayed > 0, detail: "Finish a verified match." },
    { code: "wallet-proof", name: "Wallet Proof", category: "web3", unlocked: flags.walletLinked, detail: "Link a signed wallet proof without replacing Security Key identity." },
    { code: "signed-rival", name: "Signed Rival", category: "social", unlocked: flags.hasRivalry, detail: "Create an off-chain signed rivalry challenge." },
    { code: "bread-winner", name: "Bread Winner", category: "bread", unlocked: flags.hasBread, detail: "Record a non-redeemable $Bread reward, tip, transfer, or stake event." },
    { code: "verified-ping", name: "Game Invite", category: "flockerroom", unlocked: flags.hasPing, detail: "Send an in-app invite to a rival." },
    { code: "pond-regular", name: "Pond Regular", category: "streak", unlocked: flags.matchesPlayed >= 10, detail: "Ten matches proves a streak-worthy pond habit." },
    { code: "season-opener", name: "Season Opener", category: "seasonal", unlocked: flags.walletLinked && flags.hasBread, detail: "Pair Wallet Proof with the first $Bread loop of the season." }
  ];
}
