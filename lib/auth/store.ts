import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { formatGooseHandle } from "./goose-handle";

export type PasskeyCredential = {
  id: string;
  publicKey: number[];
  counter: number;
  transports?: string[];
  deviceType?: string;
  backedUp?: boolean;
};

export type DemoUser = {
  id: string;
  name: string;
  handle: string;
  createdAt: string;
  credentials: PasskeyCredential[];
};

export type Session = {
  id: string;
  userId: string;
  createdAt: string;
};

export type Challenge = {
  key: string;
  value: string;
  userId?: string;
  purpose: "register" | "login" | "admin" | "player2" | "wallet-proof";
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  type: "admin" | "game" | "auth" | "wallet";
  message: string;
  createdAt: string;
};

export type LinkedWallet = {
  id: string;
  userId: string;
  chain: string;
  address: string;
  verifiedAt: string;
  lastSignatureChallenge?: string;
  status: "linked" | "revoked";
  createdAt: string;
};

export type SignedRivalryChallenge = {
  id: string;
  nonce: string;
  challengerUserId: string;
  rivalUserId: string;
  roomId?: string;
  gameKey: "tictac";
  linkedWalletId: string;
  walletAddress: string;
  signature: string;
  typedData: Record<string, unknown>;
  status: "signed" | "accepted" | "expired";
  expiresAt: string;
  createdAt: string;
};

export type BreadTransaction = {
  id: string;
  userId: string;
  counterpartyUserId?: string;
  amount: number;
  kind: "reward" | "gg_tip" | "friend_transfer" | "stake_lock" | "stake_release";
  status: "posted" | "locked" | "released";
  memo: string;
  challengeId?: string;
  createdAt: string;
};

export type VerifiedPing = {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  channel: "in_app";
  status: "sent" | "read";
  createdAt: string;
};

export type DogfoodFeedback = {
  id: string;
  userId: string;
  route: string;
  workflow: "wallet-proof" | "signed-rivalry" | "bread-ledger" | "verified-ping" | "achievements" | "overall-dogfood";
  expected: string;
  actual: string;
  severity: "note" | "blocked" | "bug" | "polish";
  serviceMode: "local" | "supabase" | "vercel";
  viewport: string;
  createdAt: string;
};

export type GameRoom = {
  id: string;
  gameKey: "tictac";
  board: Array<"X" | "O" | null>;
  turn: "X" | "O";
  winner: "X" | "O" | "draw" | null;
  players: {
    X?: { userId: string; goose: string; verifiedAt: string };
    O?: { userId: string; goose: string; verifiedAt: string };
  };
  moves: { mark: "X" | "O"; index: number; at: string }[];
  aiMode?: boolean;
  rematchVotes?: string[];
  completedOutcomeId?: string;
};

export type GameOutcome = {
  id: string;
  roomId: string;
  gameKey: GameRoom["gameKey"];
  winner: Exclude<GameRoom["winner"], null>;
  board: GameRoom["board"];
  moves: GameRoom["moves"];
  players: GameRoom["players"];
  aiMode: boolean;
  completedAt: string;
};

export type PlayerStats = {
  userId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  updatedAt: string;
};

type DemoStore = {
  users: DemoUser[];
  sessions: Session[];
  challenges: Challenge[];
  audits: AuditEntry[];
  rooms: GameRoom[];
  outcomes: GameOutcome[];
  playerStats: PlayerStats[];
  linkedWallets: LinkedWallet[];
  rivalryChallenges: SignedRivalryChallenge[];
  breadTransactions: BreadTransaction[];
  verifiedPings: VerifiedPing[];
  dogfoodFeedback: DogfoodFeedback[];
};

type SupabaseConfig = {
  url: string;
  secretKey: string;
  schema: string;
};

function resolveStorePath() {
  const configuredPath = process.env.DEMO_STORE_FILE || "data/demo-store.json";
  if (path.isAbsolute(configuredPath)) return configuredPath;
  if (process.env.VERCEL) return path.join("/tmp", configuredPath);
  return path.join(process.cwd(), configuredPath);
}

const storePath = resolveStorePath();
const dataDir = path.dirname(storePath);

function getSupabaseStoreClient() {
  if (typeof window !== "undefined") return null;
  if (process.env.DEMO_STORE_ADAPTER !== "supabase" && process.env.DEMO_SUPABASE_ENABLED !== "true") return null;
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const schema = process.env.SUPABASE_SCHEMA || "silly_goose_entertainment";
  if (!url || !secretKey || secretKey.includes("replace_me")) return null;
  return new SupabaseStoreClient({ url, secretKey, schema });
}

const emptyStore = (): DemoStore => ({
  users: [],
  sessions: [],
  challenges: [],
  audits: [],
  rooms: [],
  outcomes: [],
  playerStats: [],
  linkedWallets: [],
  rivalryChallenges: [],
  breadTransactions: [],
  verifiedPings: [],
  dogfoodFeedback: []
});

async function loadStore(): Promise<DemoStore> {
  const supabase = getSupabaseStoreClient();
  if (supabase) return supabase.loadStore();
  try {
    const store = JSON.parse(await readFile(storePath, "utf8")) as DemoStore;
    store.outcomes ??= [];
    store.playerStats ??= derivePlayerStats(store.outcomes);
    store.linkedWallets ??= [];
    store.rivalryChallenges ??= [];
    store.breadTransactions ??= [];
    store.verifiedPings ??= [];
    store.dogfoodFeedback ??= [];
    for (const room of store.rooms ?? []) {
      room.gameKey ??= "tictac";
    }
    return store;
  } catch {
    return emptyStore();
  }
}

async function saveStore(store: DemoStore) {
  const supabase = getSupabaseStoreClient();
  if (supabase) {
    await supabase.saveStore(store);
    return;
  }
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
}

class SupabaseStoreClient {
  constructor(private readonly config: SupabaseConfig) {}

  async loadStore(): Promise<DemoStore> {
    const [users, credentials, sessions, challenges, audits, rooms, players, moves, outcomes, playerStats, linkedWallets, rivalryChallenges, breadTransactions, verifiedPings, dogfoodFeedback] = await Promise.all([
      this.select<any>("demo_users", "select=id,handle,name,created_at&order=created_at.asc"),
      this.select<any>("passkey_credentials", "select=id,user_id,public_key,counter,transports,device_type,backed_up"),
      this.select<any>("sessions", "select=id,user_id,created_at&order=created_at.asc"),
      this.select<any>("challenges", "select=challenge_key,value,user_id,purpose,created_at&order=created_at.asc"),
      this.select<any>("audit_entries", "select=id,type,message,created_at&order=created_at.desc&limit=10"),
      this.select<any>("game_rooms", "select=id,game_key,board,turn,winner,ai_mode,rematch_votes,completed_outcome_id,created_at&order=created_at.desc"),
      this.select<any>("room_players", "select=room_id,mark,user_id,goose,verified_at"),
      this.select<any>("room_moves", "select=room_id,mark,square_index,created_at&order=created_at.asc"),
      this.select<any>("game_outcomes", "select=id,room_id,game_key,winner,board,moves,players,ai_mode,completed_at&order=completed_at.desc"),
      this.select<any>("player_stats", "select=user_id,games_played,wins,losses,draws,win_rate,current_streak,updated_at&order=wins.desc,games_played.desc,updated_at.desc"),
      this.select<any>("linked_wallets", "select=id,user_id,chain,address,verified_at,last_signature_challenge,status,created_at&order=verified_at.desc"),
      this.select<any>("signed_rivalry_challenges", "select=id,nonce,challenger_user_id,rival_user_id,room_id,game_key,linked_wallet_id,wallet_address,signature,typed_data,status,expires_at,created_at&order=created_at.desc"),
      this.select<any>("bread_transactions", "select=id,user_id,counterparty_user_id,amount,kind,status,memo,challenge_id,created_at&order=created_at.desc"),
      this.select<any>("verified_pings", "select=id,from_user_id,to_user_id,message,channel,status,created_at&order=created_at.desc"),
      this.select<any>("dogfood_feedback", "select=id,user_id,route,workflow,expected,actual,severity,service_mode,viewport,created_at&order=created_at.desc")
    ]);

    const credentialsByUser = new Map<string, PasskeyCredential[]>();
    for (const row of credentials) {
      const bucket = credentialsByUser.get(row.user_id) ?? [];
      bucket.push({
        id: row.id,
        publicKey: Array.isArray(row.public_key) ? row.public_key : [],
        counter: Number(row.counter ?? 0),
        transports: row.transports ?? [],
        deviceType: row.device_type ?? undefined,
        backedUp: row.backed_up ?? undefined
      });
      credentialsByUser.set(row.user_id, bucket);
    }

    const playersByRoom = new Map<string, GameRoom["players"]>();
    for (const row of players) {
      const roomPlayers = playersByRoom.get(row.room_id) ?? {};
      roomPlayers[row.mark as "X" | "O"] = { userId: row.user_id, goose: row.goose, verifiedAt: row.verified_at };
      playersByRoom.set(row.room_id, roomPlayers);
    }

    const movesByRoom = new Map<string, GameRoom["moves"]>();
    for (const row of moves) {
      const bucket = movesByRoom.get(row.room_id) ?? [];
      bucket.push({ mark: row.mark, index: row.square_index, at: row.created_at });
      movesByRoom.set(row.room_id, bucket);
    }

    const mappedOutcomes = outcomes.map((row) => ({
      id: row.id,
      roomId: row.room_id,
      gameKey: row.game_key ?? "tictac",
      winner: row.winner,
      board: row.board,
      moves: row.moves ?? [],
      players: row.players ?? {},
      aiMode: row.ai_mode,
      completedAt: row.completed_at
    }));

    return {
      users: users.map((row) => ({
        id: row.id,
        name: row.name,
        handle: row.handle,
        createdAt: row.created_at,
        credentials: credentialsByUser.get(row.id) ?? []
      })),
      sessions: sessions.map((row) => ({ id: row.id, userId: row.user_id, createdAt: row.created_at })),
      challenges: challenges.map((row) => ({
        key: row.challenge_key,
        value: row.value,
        userId: row.user_id ?? undefined,
        purpose: row.purpose,
        createdAt: row.created_at
      })),
      audits: audits.map((row) => ({ id: row.id, type: row.type, message: row.message, createdAt: row.created_at })),
      rooms: rooms.map((row) => ({
        id: row.id,
        gameKey: row.game_key ?? "tictac",
        board: row.board,
        turn: row.turn,
        winner: row.winner,
        players: playersByRoom.get(row.id) ?? {},
        moves: movesByRoom.get(row.id) ?? [],
        aiMode: row.ai_mode,
        rematchVotes: row.rematch_votes ?? [],
        completedOutcomeId: row.completed_outcome_id ?? undefined
      })),
      outcomes: mappedOutcomes,
      playerStats: playerStats.length ? playerStats.map((row) => ({
        userId: row.user_id,
        gamesPlayed: Number(row.games_played ?? 0),
        wins: Number(row.wins ?? 0),
        losses: Number(row.losses ?? 0),
        draws: Number(row.draws ?? 0),
        winRate: Number(row.win_rate ?? 0),
        currentStreak: Number(row.current_streak ?? 0),
        updatedAt: row.updated_at
      })) : derivePlayerStats(mappedOutcomes),
      linkedWallets: linkedWallets.map((row) => ({
        id: row.id,
        userId: row.user_id,
        chain: row.chain,
        address: row.address,
        verifiedAt: row.verified_at,
        lastSignatureChallenge: row.last_signature_challenge ?? undefined,
        status: row.status,
        createdAt: row.created_at
      })),
      rivalryChallenges: rivalryChallenges.map((row) => ({
        id: row.id,
        nonce: row.nonce,
        challengerUserId: row.challenger_user_id,
        rivalUserId: row.rival_user_id,
        roomId: row.room_id ?? undefined,
        gameKey: row.game_key ?? "tictac",
        linkedWalletId: row.linked_wallet_id,
        walletAddress: row.wallet_address,
        signature: row.signature,
        typedData: row.typed_data ?? {},
        status: row.status,
        expiresAt: row.expires_at,
        createdAt: row.created_at
      })),
      breadTransactions: breadTransactions.map((row) => ({
        id: row.id,
        userId: row.user_id,
        counterpartyUserId: row.counterparty_user_id ?? undefined,
        amount: Number(row.amount ?? 0),
        kind: row.kind,
        status: row.status,
        memo: row.memo,
        challengeId: row.challenge_id ?? undefined,
        createdAt: row.created_at
      })),
      verifiedPings: verifiedPings.map((row) => ({
        id: row.id,
        fromUserId: row.from_user_id,
        toUserId: row.to_user_id,
        message: row.message,
        channel: row.channel ?? "in_app",
        status: row.status,
        createdAt: row.created_at
      })),
      dogfoodFeedback: dogfoodFeedback.map((row) => ({
        id: row.id,
        userId: row.user_id,
        route: row.route,
        workflow: row.workflow,
        expected: row.expected,
        actual: row.actual,
        severity: row.severity,
        serviceMode: row.service_mode,
        viewport: row.viewport,
        createdAt: row.created_at
      }))
    };
  }

  async saveStore(store: DemoStore) {
    const now = new Date().toISOString();
    const durableUsers = [...store.users];
    if (store.rooms.some((room) => room.players.O?.userId === "offline-minimax-demo") && !durableUsers.some((user) => user.id === "offline-minimax-demo")) {
      durableUsers.push({
        id: "offline-minimax-demo",
        handle: "0xAI-Goose",
        name: "0xAI-Goose",
        createdAt: now,
        credentials: []
      });
    }

    await this.replaceRows("demo_users", "id", durableUsers.map((user) => ({
      id: user.id,
      handle: user.handle,
      name: user.name,
      verified_signer_type: "webauthn",
      created_at: user.createdAt,
      updated_at: now
    })));

    await this.replaceChildRows("passkey_credentials", "user_id", durableUsers.map((user) => user.id), durableUsers.flatMap((user) =>
      user.credentials.map((credential) => ({
        id: credential.id,
        user_id: user.id,
        public_key: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports ?? [],
        device_type: credential.deviceType ?? null,
        backed_up: credential.backedUp ?? null
      }))
    ), "id");

    await this.replaceRows("sessions", "id", store.sessions.map((session) => ({
      id: session.id,
      user_id: session.userId,
      created_at: session.createdAt,
      expires_at: null
    })));

    await this.replaceRows("challenges", "challenge_key", store.challenges.map((challenge) => ({
      challenge_key: challenge.key,
      value: challenge.value,
      user_id: challenge.userId ?? null,
      purpose: challenge.purpose,
      created_at: challenge.createdAt,
      expires_at: null
    })));

    await this.replaceRows("audit_entries", "id", store.audits.slice(0, 10).map((audit) => ({
      id: audit.id,
      type: audit.type,
      message: audit.message,
      created_at: audit.createdAt
    })));

    await this.replaceRows("linked_wallets", "id", (store.linkedWallets ?? []).map((wallet) => ({
      id: wallet.id,
      user_id: wallet.userId,
      chain: wallet.chain,
      address: wallet.address,
      verified_at: wallet.verifiedAt,
      last_signature_challenge: wallet.lastSignatureChallenge ?? null,
      status: wallet.status,
      created_at: wallet.createdAt
    })));

    await this.replaceRows("signed_rivalry_challenges", "id", (store.rivalryChallenges ?? []).map((challenge) => ({
      id: challenge.id,
      nonce: challenge.nonce,
      challenger_user_id: challenge.challengerUserId,
      rival_user_id: challenge.rivalUserId,
      room_id: challenge.roomId ?? null,
      game_key: challenge.gameKey,
      linked_wallet_id: challenge.linkedWalletId,
      wallet_address: challenge.walletAddress,
      signature: challenge.signature,
      typed_data: challenge.typedData,
      status: challenge.status,
      expires_at: challenge.expiresAt,
      created_at: challenge.createdAt
    })));

    await this.replaceRows("bread_transactions", "id", (store.breadTransactions ?? []).map((transaction) => ({
      id: transaction.id,
      user_id: transaction.userId,
      counterparty_user_id: transaction.counterpartyUserId ?? null,
      amount: transaction.amount,
      kind: transaction.kind,
      status: transaction.status,
      memo: transaction.memo,
      challenge_id: transaction.challengeId ?? null,
      created_at: transaction.createdAt
    })));

    await this.replaceRows("verified_pings", "id", (store.verifiedPings ?? []).map((ping) => ({
      id: ping.id,
      from_user_id: ping.fromUserId,
      to_user_id: ping.toUserId,
      message: ping.message,
      channel: ping.channel,
      status: ping.status,
      created_at: ping.createdAt
    })));

    await this.replaceRows("dogfood_feedback", "id", (store.dogfoodFeedback ?? []).map((feedback) => ({
      id: feedback.id,
      user_id: feedback.userId,
      route: feedback.route,
      workflow: feedback.workflow,
      expected: feedback.expected,
      actual: feedback.actual,
      severity: feedback.severity,
      service_mode: feedback.serviceMode,
      viewport: feedback.viewport,
      created_at: feedback.createdAt
    })));

    await this.replaceRows("game_rooms", "id", store.rooms.map((room) => ({
      id: room.id,
      game_key: room.gameKey,
      board: room.board,
      turn: room.turn,
      winner: room.winner,
      ai_mode: Boolean(room.aiMode),
      rematch_votes: room.rematchVotes ?? [],
      completed_outcome_id: null,
      updated_at: now
    })));

    await this.replaceRoomChildren(store);

    await this.replaceRows("game_outcomes", "id", store.outcomes.map((outcome) => ({
      id: outcome.id,
      room_id: outcome.roomId,
      game_key: outcome.gameKey,
      winner: outcome.winner,
      board: outcome.board,
      moves: outcome.moves,
      players: outcome.players,
      ai_mode: outcome.aiMode,
      completed_at: outcome.completedAt
    })));

    const playerStats = store.playerStats?.length ? store.playerStats : derivePlayerStats(store.outcomes);
    await this.replaceRows("player_stats", "user_id", playerStats.map((stats) => ({
      user_id: stats.userId,
      games_played: stats.gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      win_rate: stats.winRate,
      current_streak: stats.currentStreak,
      updated_at: stats.updatedAt
    })));

    for (const room of store.rooms.filter((candidate) => candidate.completedOutcomeId)) {
      await this.request("game_rooms", {
        method: "PATCH",
        query: `id=eq.${encodeURIComponent(room.id)}`,
        body: { completed_outcome_id: room.completedOutcomeId },
        prefer: "return=minimal"
      });
    }
  }

  private async replaceRoomChildren(store: DemoStore) {
    for (const room of store.rooms) {
      await this.deleteWhere("room_players", `room_id=eq.${encodeURIComponent(room.id)}`);
      await this.deleteWhere("room_moves", `room_id=eq.${encodeURIComponent(room.id)}`);
    }
    const playerRows = store.rooms.flatMap((room) =>
      (["X", "O"] as const).flatMap((mark) => {
        const player = room.players[mark];
        return player ? [{ room_id: room.id, mark, user_id: player.userId, goose: player.goose, verified_at: player.verifiedAt }] : [];
      })
    );
    if (playerRows.length) await this.upsert("room_players", playerRows, "room_id,mark");

    const moveRows = store.rooms.flatMap((room) =>
      room.moves.map((move) => ({
        room_id: room.id,
        mark: move.mark,
        user_id: room.players[move.mark]?.userId ?? "offline-minimax-demo",
        square_index: move.index,
        created_at: move.at
      }))
    );
    if (moveRows.length) await this.request("room_moves", { method: "POST", body: moveRows, prefer: "return=minimal" });
  }

  private async replaceChildRows(table: string, parentColumn: string, parentIds: string[], rows: unknown[], conflictKey: string) {
    for (const parentId of parentIds) {
      await this.deleteWhere(table, `${parentColumn}=eq.${encodeURIComponent(parentId)}`);
    }
    await this.upsert(table, rows, conflictKey);
  }

  private async replaceRows(table: string, key: string, rows: any[]) {
    const existing = await this.select<Record<string, string>>(table, `select=${key}`);
    const keep = new Set(rows.map((row) => String(row[key])));
    for (const row of existing) {
      const value = String(row[key]);
      if (!keep.has(value)) await this.deleteWhere(table, `${key}=eq.${encodeURIComponent(value)}`);
    }
    await this.upsert(table, rows, key);
  }

  private async upsert(table: string, rows: unknown[], conflictKey: string) {
    if (!rows.length) return;
    await this.request(table, {
      method: "POST",
      query: `on_conflict=${encodeURIComponent(conflictKey)}`,
      body: rows,
      prefer: "resolution=merge-duplicates,return=minimal"
    });
  }

  private select<T>(table: string, query = "") {
    return this.request<T[]>(table, { method: "GET", query });
  }

  private deleteWhere(table: string, query: string) {
    return this.request(table, { method: "DELETE", query, prefer: "return=minimal" });
  }

  private async request<T = unknown>(table: string, options: { method: "GET" | "POST" | "PATCH" | "DELETE"; query?: string; body?: unknown; prefer?: string }) {
    const query = options.query ? `?${options.query}` : "";
    const response = await fetch(`${this.config.url}/rest/v1/${table}${query}`, {
      method: options.method,
      headers: {
        apikey: this.config.secretKey,
        Authorization: `Bearer ${this.config.secretKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": this.config.schema,
        "Content-Profile": this.config.schema,
        ...(options.prefer ? { Prefer: options.prefer } : {})
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store"
    });
    const text = await response.text();
    if (!response.ok && text.includes("PGRST106")) {
      throw new Error(`Supabase schema "${this.config.schema}" is not exposed through the Data API. Add it to the exposed schemas list in Supabase before enabling DEMO_STORE_ADAPTER=supabase.`);
    }
    if (!response.ok) throw new Error(text || `${options.method} ${table} failed with ${response.status}`);
    if (!text) return [] as T;
    return JSON.parse(text) as T;
  }
}

export async function updateStore<T>(updater: (store: DemoStore) => T | Promise<T>) {
  const store = await loadStore();
  const result = await updater(store);
  await saveStore(store);
  return result;
}

export async function readStore() {
  return loadStore();
}

export async function getRegisteredAccounts() {
  const store = await loadStore();
  return store.users
    .filter((user) => user.credentials.length > 0)
    .map((user) => ({
      id: user.id,
      name: user.name,
      handle: user.handle,
      credentialCount: user.credentials.length,
      createdAt: user.createdAt
    }))
    .sort((a, b) => a.handle.localeCompare(b.handle));
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 14)}`;
}

export function derivePlayerStats(outcomes: GameOutcome[]): PlayerStats[] {
  const statsByUser = new Map<string, PlayerStats>();
  const sorted = [...outcomes].sort((a, b) => a.completedAt.localeCompare(b.completedAt));

  for (const outcome of sorted) {
    for (const mark of ["X", "O"] as const) {
      const player = outcome.players[mark];
      if (!player || player.userId === "offline-minimax-demo") continue;
      const stats = statsByUser.get(player.userId) ?? {
        userId: player.userId,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        currentStreak: 0,
        updatedAt: outcome.completedAt
      };
      stats.gamesPlayed += 1;
      if (outcome.winner === "draw") {
        stats.draws += 1;
        stats.currentStreak = 0;
      } else if (outcome.winner === mark) {
        stats.wins += 1;
        stats.currentStreak = Math.max(0, stats.currentStreak) + 1;
      } else {
        stats.losses += 1;
        stats.currentStreak = Math.min(0, stats.currentStreak) - 1;
      }
      stats.winRate = Number(((stats.wins / stats.gamesPlayed) * 100).toFixed(2));
      stats.updatedAt = outcome.completedAt;
      statsByUser.set(player.userId, stats);
    }
  }

  return Array.from(statsByUser.values()).sort((a, b) => {
    return b.wins - a.wins || b.gamesPlayed - a.gamesPlayed || b.winRate - a.winRate || b.updatedAt.localeCompare(a.updatedAt);
  });
}

export async function getOrCreateUser(handle: string) {
  return updateStore((store) => {
    const normalized = formatGooseHandle(handle);
    const legacy = handle.trim().toLowerCase();
    let user = store.users.find((candidate) => {
      const stored = candidate.handle.toLowerCase();
      return stored === normalized.toLowerCase() || stored === legacy;
    });
    if (!user) {
      user = {
        id: newId("user"),
        name: normalized,
        handle: normalized,
        createdAt: new Date().toISOString(),
        credentials: []
      };
      store.users.push(user);
    } else if (user.handle !== normalized) {
      user.handle = normalized;
      user.name = normalized;
    }
    return user;
  });
}

export async function addAudit(message: string, type: AuditEntry["type"] = "auth") {
  return updateStore((store) => {
    const entry: AuditEntry = { id: newId("audit"), type, message, createdAt: new Date().toISOString() };
    store.audits.unshift(entry);
    store.audits = store.audits.slice(0, 10);
    return entry;
  });
}
