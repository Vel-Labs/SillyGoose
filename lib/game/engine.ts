import { newId, updateStore, type GameRoom } from "@/lib/auth/store";

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

export async function createRoom(userId: string, aiMode = false, goose = "Afro Goose with 3D Glasses") {
  return updateStore((store) => {
    const room: GameRoom = {
      id: newId("goose"),
      board: Array(9).fill(null),
      turn: "X",
      winner: null,
      players: {
        X: { userId, goose, verifiedAt: new Date().toISOString() }
      },
      moves: [],
      aiMode
    };
    if (aiMode) {
      room.players.O = { userId: "offline-minimax-demo", goose: "Offline MiniMax Demo Goose", verifiedAt: new Date().toISOString() };
    }
    store.rooms.unshift(room);
    return room;
  });
}

export async function joinRoom(roomId: string, userId: string) {
  return updateStore((store) => {
    const room = store.rooms.find((candidate) => candidate.id === roomId);
    if (!room) throw new Error("Room not found.");
    if (room.players.X?.userId === userId) throw new Error("Player Two must authenticate with a different Ledger credential.");
    if (room.players.O && room.players.O.userId !== userId) throw new Error("This room already has Player Two.");
    room.players.O = { userId, goose: "El Jefe Goose", verifiedAt: new Date().toISOString() };
    return room;
  });
}

export async function makeMove(roomId: string, mark: "X" | "O", index: number) {
  return updateStore((store) => {
    const room = store.rooms.find((candidate) => candidate.id === roomId);
    if (!room) throw new Error("Room not found.");
    if (room.winner) throw new Error("This match is already complete.");
    if (room.turn !== mark) throw new Error(`It is ${room.turn}'s turn.`);
    if (index < 0 || index > 8 || room.board[index]) throw new Error("That square is not available.");
    room.board[index] = mark;
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
    return room;
  });
}

export function chooseAiMove(board: GameRoom["board"]) {
  const preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  return preferred.find((index) => !board[index]) ?? 0;
}
