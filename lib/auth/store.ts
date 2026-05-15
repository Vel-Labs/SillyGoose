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
  purpose: "register" | "login" | "admin" | "player2";
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  type: "admin" | "game" | "auth";
  message: string;
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

type DemoStore = {
  users: DemoUser[];
  sessions: Session[];
  challenges: Challenge[];
  audits: AuditEntry[];
  rooms: GameRoom[];
  outcomes: GameOutcome[];
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
  outcomes: []
});

async function loadStore(): Promise<DemoStore> {
  const supabase = getSupabaseStoreClient();
  if (supabase) return supabase.loadStore();
  try {
    const store = JSON.parse(await readFile(storePath, "utf8")) as DemoStore;
    store.outcomes ??= [];
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
    const [users, credentials, sessions, challenges, audits, rooms, players, moves, outcomes] = await Promise.all([
      this.select<any>("demo_users", "select=id,handle,name,created_at&order=created_at.asc"),
      this.select<any>("passkey_credentials", "select=id,user_id,public_key,counter,transports,device_type,backed_up"),
      this.select<any>("sessions", "select=id,user_id,created_at&order=created_at.asc"),
      this.select<any>("challenges", "select=challenge_key,value,user_id,purpose,created_at&order=created_at.asc"),
      this.select<any>("audit_entries", "select=id,type,message,created_at&order=created_at.desc&limit=10"),
      this.select<any>("game_rooms", "select=id,game_key,board,turn,winner,ai_mode,rematch_votes,completed_outcome_id,created_at&order=created_at.desc"),
      this.select<any>("room_players", "select=room_id,mark,user_id,goose,verified_at"),
      this.select<any>("room_moves", "select=room_id,mark,square_index,created_at&order=created_at.asc"),
      this.select<any>("game_outcomes", "select=id,room_id,game_key,winner,board,moves,players,ai_mode,completed_at&order=completed_at.desc")
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
      outcomes: outcomes.map((row) => ({
        id: row.id,
        roomId: row.room_id,
        gameKey: row.game_key ?? "tictac",
        winner: row.winner,
        board: row.board,
        moves: row.moves ?? [],
        players: row.players ?? {},
        aiMode: row.ai_mode,
        completedAt: row.completed_at
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
    if (playerRows.length) await this.request("room_players", { method: "POST", body: playerRows, prefer: "return=minimal" });

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

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 14)}`;
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
