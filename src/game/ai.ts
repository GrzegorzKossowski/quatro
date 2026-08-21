import {
  BOARD_SIZE,
  applyMove,
  checkWin,
  legalMovesForPlayer,
  otherPlayer,
  type Board,
  type Move,
  type Player,
} from './board.ts';

export const AI_DEFAULT_DEPTH = 5;

const WIN_SCORE = 1_000_000;

/** Every 4-cell line that can trigger a win: 4 rows, 4 columns, the 4 corners, 9 possible 2x2 squares. */
const PATTERNS: number[][] = buildPatterns();

function buildPatterns(): number[][] {
  const patterns: number[][] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    patterns.push([0, 1, 2, 3].map((col) => row * BOARD_SIZE + col));
  }
  for (let col = 0; col < BOARD_SIZE; col++) {
    patterns.push([0, 1, 2, 3].map((row) => row * BOARD_SIZE + col));
  }

  const last = BOARD_SIZE - 1;
  patterns.push([0, last, last * BOARD_SIZE, last * BOARD_SIZE + last]);

  for (let row = 0; row < BOARD_SIZE - 1; row++) {
    for (let col = 0; col < BOARD_SIZE - 1; col++) {
      patterns.push([
        row * BOARD_SIZE + col,
        row * BOARD_SIZE + col + 1,
        (row + 1) * BOARD_SIZE + col,
        (row + 1) * BOARD_SIZE + col + 1,
      ]);
    }
  }

  return patterns;
}

/** Progressive reward for owning N of 4 cells in an otherwise-uncontested pattern. */
const PATTERN_WEIGHT = [0, 1, 6, 30];

/**
 * Heuristic score of `board` from `player`'s point of view (positive is good
 * for `player`). Rewards patterns `player` partially controls and penalizes
 * ones the opponent partially controls, so the search has a signal even far
 * from an outright win.
 */
function evaluate(board: Board, player: Player): number {
  const opponent = otherPlayer(player);
  let score = 0;

  for (const pattern of PATTERNS) {
    let own = 0;
    let theirs = 0;
    for (const idx of pattern) {
      const cell = board[idx];
      if (cell === player) own++;
      else if (cell === opponent) theirs++;
    }
    if (theirs === 0 && own > 0) score += PATTERN_WEIGHT[own] ?? 0;
    if (own === 0 && theirs > 0) score -= PATTERN_WEIGHT[theirs] ?? 0;
  }

  return score;
}

/** Negamax with alpha-beta pruning. Returns the best score for `playerToMove`. */
function negamax(board: Board, playerToMove: Player, depth: number, alpha: number, beta: number): number {
  const moves = legalMovesForPlayer(board, playerToMove);
  if (moves.length === 0 || depth === 0) {
    return evaluate(board, playerToMove);
  }

  let best = -Infinity;
  const opponent = otherPlayer(playerToMove);

  for (const move of moves) {
    const next = applyMove(board, move);
    const score = checkWin(next, playerToMove)
      ? WIN_SCORE + depth
      : -negamax(next, opponent, depth - 1, -beta, -alpha);

    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }

  return best;
}

/** Picks the AI's move for `player`. Returns null if no legal move exists. */
export function chooseMove(board: Board, player: Player, depth: number = AI_DEFAULT_DEPTH): Move | null {
  const moves = legalMovesForPlayer(board, player);
  if (moves.length === 0) return null;

  const opponent = otherPlayer(player);
  let bestMove = moves[0]!;
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applyMove(board, move);
    const score = checkWin(next, player) ? WIN_SCORE + depth : -negamax(next, opponent, depth - 1, -Infinity, Infinity);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
