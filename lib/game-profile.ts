import type { DemoUser, GameOutcome } from "@/lib/auth/store";

export type GameId = "ticTacToe" | "battleship" | "connect4" | "pondRacers" | "honkMemory";

export type GameAvailability = "playable" | "comingSoon" | "locked";

export type GameRecord = {
  gameId: GameId;
  wins: number;
  losses: number;
  draws?: number;
  rating?: number;
  matchesPlayed: number;
};

export type GooseProfileStats = {
  handle: string;
  activeGooseId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  overallRating: number;
  gameRecords: GameRecord[];
  achievementsUnlocked: number;
};

export const gameLabels: Record<GameId, string> = {
  ticTacToe: "Tic-Tac-Toe",
  battleship: "Battleship",
  connect4: "Connect 4",
  pondRacers: "Pond Racers",
  honkMemory: "Honk Memory"
};

export function buildGooseProfileStats(user: DemoUser, outcomes: GameOutcome[], activeGooseId: string): GooseProfileStats {
  const ticTacToe = buildTicTacToeRecord(outcomes, user.id);
  const wins = ticTacToe.wins;
  const losses = ticTacToe.losses;
  const draws = ticTacToe.draws ?? 0;
  const matchesPlayed = ticTacToe.matchesPlayed;
  const overallRating = 1000 + wins * 42 + draws * 10 - losses * 18;
  const achievementsUnlocked = [
    matchesPlayed >= 1,
    wins >= 1,
    wins >= 5,
    matchesPlayed >= 10
  ].filter(Boolean).length;

  return {
    handle: user.handle,
    activeGooseId,
    matchesPlayed,
    wins,
    losses,
    draws,
    overallRating,
    achievementsUnlocked,
    gameRecords: [
      { ...ticTacToe, rating: overallRating },
      { gameId: "battleship", wins: 0, losses: 0, draws: 0, matchesPlayed: 0 },
      { gameId: "connect4", wins: 0, losses: 0, draws: 0, matchesPlayed: 0 },
      { gameId: "pondRacers", wins: 0, losses: 0, draws: 0, matchesPlayed: 0 },
      { gameId: "honkMemory", wins: 0, losses: 0, draws: 0, matchesPlayed: 0 }
    ]
  };
}

export function getOperatorClass(stats: GooseProfileStats) {
  if (stats.wins >= 25) return "Flock Boss";
  if (stats.wins >= 10) return "Pond Regular";
  if (stats.matchesPlayed >= 1) return "Verified Competitor";
  return "Fresh Hatchling";
}

export function getRarity(stats: GooseProfileStats) {
  if (stats.achievementsUnlocked >= 10) return "Mythic Menace";
  if (stats.wins >= 25) return "Legendary Goose";
  if (stats.matchesPlayed >= 10) return "Rare Honker";
  return "Common Goose";
}

export function getOverallRank(stats: GooseProfileStats) {
  if (stats.overallRating >= 1600) return "Grand Goose";
  if (stats.overallRating >= 1300) return "Pond Menace";
  if (stats.overallRating >= 1100) return "Flock Contender";
  return "Unranked Gosling";
}

export function getWinRate(stats: GooseProfileStats) {
  return stats.matchesPlayed ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;
}

function buildTicTacToeRecord(outcomes: GameOutcome[], userId: string): GameRecord {
  const record: GameRecord = {
    gameId: "ticTacToe",
    wins: 0,
    losses: 0,
    draws: 0,
    matchesPlayed: 0
  };

  for (const outcome of outcomes) {
    const mark = outcome.players.X?.userId === userId ? "X" : "O";
    record.matchesPlayed += 1;
    if (outcome.winner === "draw") record.draws = (record.draws ?? 0) + 1;
    else if (outcome.winner === mark) record.wins += 1;
    else record.losses += 1;
  }

  return record;
}
