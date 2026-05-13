import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "silly-goose-game-"));
  process.chdir(tempDir);
  vi.resetModules();
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(tempDir, { recursive: true, force: true });
  vi.resetModules();
});

describe("game engine persistence", () => {
  it("creates tic-tac-toe-scoped room ids and records completed outcomes", async () => {
    const { createRoom, joinRoom, makeMove } = await import("@/lib/game/engine");
    const { readStore } = await import("@/lib/auth/store");

    const room = await createRoom("player-one", false, "captain");
    expect(room.id).toMatch(/^tictac_[A-F0-9]{4}$/);

    await joinRoom(room.id, "player-two", "jefe");
    await makeMove(room.id, "player-one", 0);
    await makeMove(room.id, "player-two", 3);
    await makeMove(room.id, "player-one", 1);
    await makeMove(room.id, "player-two", 4);
    const completed = await makeMove(room.id, "player-one", 2);

    expect(completed.winner).toBe("X");

    const store = await readStore();
    expect(store.outcomes).toHaveLength(1);
    expect(store.outcomes[0]).toMatchObject({
      roomId: room.id,
      gameKey: "tictac",
      winner: "X",
      aiMode: false
    });
    expect(store.outcomes[0].moves.map((move) => move.index)).toEqual([0, 3, 1, 4, 2]);
  });
});
