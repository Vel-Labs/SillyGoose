import { newId, updateStore, type GameOutcome, type GameRoom } from "@/lib/auth/store";

const TIC_TAC_TOE_KEY = "tictac";

const wins = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

export function calculateWinner(board: GameRoom["board"]) {
  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? "draw" : null;
}

export function nextMark(mark: "X" | "O") {
  return mark === "X" ? "O" : "X";
}

function shortRoomToken() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 4).toUpperCase();
}

function createGameRoomId(existingIds: Set<string>) {
  let id = `${TIC_TAC_TOE_KEY}_${shortRoomToken()}`;
  while (existingIds.has(id)) id = `${TIC_TAC_TOE_KEY}_${shortRoomToken()}`;
  return id;
}

function recordOutcomeIfComplete(store: { outcomes: GameOutcome[] }, room: GameRoom) {
  if (!room.winner || room.completedOutcomeId) return;
  const outcome = {
    id: newId("outcome"),
    roomId: room.id,
    gameKey: room.gameKey,
    winner: room.winner,
    board: [...room.board],
    moves: room.moves.map((move) => ({ ...move })),
    players: {
      X: room.players.X ? { ...room.players.X } : undefined,
      O: room.players.O ? { ...room.players.O } : undefined
    },
    aiMode: Boolean(room.aiMode),
    completedAt: new Date().toISOString()
  };
  room.completedOutcomeId = outcome.id;
  store.outcomes.unshift(outcome);
}

export async function createRoom(userId: string, aiMode = false, goose = "Afro Goose with 3D Glasses") {
  return updateStore((store) => {
    const room: GameRoom = {
      id: createGameRoomId(new Set(store.rooms.map((candidate) => candidate.id))),
      gameKey: TIC_TAC_TOE_KEY,
      board: Array(9).fill(null),
      turn: "X",
      winner: null,
      players: {
        X: { userId, goose, verifiedAt: new Date().toISOString() }
      },
      moves: [],
      rematchVotes: [],
      aiMode
    };
    if (aiMode) {
      room.players.O = { userId: "offline-minimax-demo", goose: "ai", verifiedAt: new Date().toISOString() };
    }
    store.rooms.unshift(room);
    return room;
  });
}

export async function joinRoom(roomId: string, userId: string, goose = "El Jefe Goose") {
  return updateStore((store) => {
    const room = store.rooms.find((candidate) => candidate.id === roomId);
    if (!room) throw new Error("Room not found.");
    if (room.players.X?.userId === userId) throw new Error("Player Two must authenticate with a different Ledger credential.");
    if (room.players.O && room.players.O.userId !== userId) throw new Error("This room already has Player Two.");
    room.players.O = { userId, goose, verifiedAt: new Date().toISOString() };
    return room;
  });
}

export function markForUser(room: GameRoom, userId: string): "X" | "O" | null {
  if (room.players.X?.userId === userId) return "X";
  if (room.players.O?.userId === userId) return "O";
  return null;
}

export async function makeMove(roomId: string, userId: string, index: number) {
  return updateStore((store) => {
    const room = store.rooms.find((candidate) => candidate.id === roomId);
    if (!room) throw new Error("Room not found.");
    const mark = markForUser(room, userId);
    if (!mark) throw new Error("This room is locked. You can spectate, but only the two verified players can move.");
    if (room.aiMode && mark !== "X") throw new Error("The offline AI owns Player Two in this room.");
    if (room.winner) throw new Error("This match is already complete.");
    if (room.turn !== mark) throw new Error(`It is ${room.turn}'s turn.`);
    if (index < 0 || index > 8 || room.board[index]) throw new Error("That square is not available.");
    room.board[index] = mark;
    room.rematchVotes = [];
    room.moves.push({ mark, index, at: new Date().toISOString() });
    room.winner = calculateWinner(room.board);
    room.turn = room.winner ? room.turn : nextMark(mark);
    if (room.aiMode && room.turn === "O" && !room.winner) {
      const aiIndex = chooseAiMove(room.board);
      room.board[aiIndex] = "O";
      room.moves.push({ mark: "O", index: aiIndex, at: new Date().toISOString() });
      room.winner = calculateWinner(room.board);
      room.turn = room.winner ? room.turn : "X";
    }
    recordOutcomeIfComplete(store, room);
    return room;
  });
}

function resetBoard(room: GameRoom) {
  room.board = Array(9).fill(null);
  room.turn = "X";
  room.winner = null;
  room.moves = [];
  room.rematchVotes = [];
  room.completedOutcomeId = undefined;
}

export async function requestRematch(roomId: string, userId: string) {
  return updateStore((store) => {
    const room = store.rooms.find((candidate) => candidate.id === roomId);
    if (!room) throw new Error("Room not found.");
    const mark = markForUser(room, userId);
    if (!mark) throw new Error("Only a verified player can request a rematch.");
    if (!room.winner) throw new Error("Finish this match before starting a rematch.");
    const votes = new Set(room.rematchVotes ?? []);
    votes.add(userId);
    if (room.aiMode) votes.add(room.players.O?.userId ?? "offline-minimax-demo");
    room.rematchVotes = Array.from(votes);
    const needed = room.aiMode ? 2 : room.players.O ? 2 : 1;
    const reset = room.rematchVotes.length >= needed;
    if (reset) resetBoard(room);
    return { room, reset };
  });
}

export function chooseAiMove(board: GameRoom["board"]) {
  const winningMove = findLineMove(board, "O");
  if (winningMove !== null) return winningMove;
  const blockingMove = findLineMove(board, "X");
  if (blockingMove !== null) return blockingMove;
  const preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  return preferred.find((index) => !board[index]) ?? 0;
}

function findLineMove(board: GameRoom["board"], mark: "X" | "O") {
  for (const [a, b, c] of wins) {
    const line = [board[a], board[b], board[c]];
    const marks = line.filter((cell) => cell === mark).length;
    const blanks = [a, b, c].filter((index) => !board[index]);
    if (marks === 2 && blanks.length === 1) return blanks[0];
  }
  return null;
}
