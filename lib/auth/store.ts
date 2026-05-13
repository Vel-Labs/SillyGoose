import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
  board: Array<"X" | "O" | null>;
  turn: "X" | "O";
  winner: "X" | "O" | "draw" | null;
  players: {
    X?: { userId: string; goose: string; verifiedAt: string };
    O?: { userId: string; goose: string; verifiedAt: string };
  };
  moves: { mark: "X" | "O"; index: number; at: string }[];
  aiMode?: boolean;
};

type DemoStore = {
  users: DemoUser[];
  sessions: Session[];
  challenges: Challenge[];
  audits: AuditEntry[];
  rooms: GameRoom[];
};

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "demo-store.json");

const emptyStore = (): DemoStore => ({
  users: [],
  sessions: [],
  challenges: [],
  audits: [],
  rooms: []
});

async function loadStore(): Promise<DemoStore> {
  try {
    return JSON.parse(await readFile(storePath, "utf8")) as DemoStore;
  } catch {
    return emptyStore();
  }
}

async function saveStore(store: DemoStore) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
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
    const normalized = handle.trim().toLowerCase() || "captain-goose";
    let user = store.users.find((candidate) => candidate.handle === normalized);
    if (!user) {
      user = {
        id: newId("user"),
        name: normalized
          .split(/[-_.\s]+/)
          .filter(Boolean)
          .map((part) => part[0]?.toUpperCase() + part.slice(1))
          .join(" ") || "Captain Goose",
        handle: normalized,
        createdAt: new Date().toISOString(),
        credentials: []
      };
      store.users.push(user);
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
